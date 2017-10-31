---
layout: post
title: Backpropagating through continuous and discrete samples
---

<!-- > Keywords: reparametrization trick, Gumbel max trick, Gumbel softmax, Concrete distribution, score function estimator, REINFORCE
-->

## Motivation and Problems

There are many situations in machine learning where we are faced with minimizing a loss of the form:
$L(\theta, \phi) = \mathbf{E}_{x\sim p_\phi(x)}[f_{\theta}(x)]$

To minimize $L(\theta, \phi)$ using gradient descent, one has to compute the gradients $\nabla_{\theta} L(\theta, \phi)$ and $\nabla_{\phi} L(\theta, \phi)$.

- The first gradient $\nabla_{\theta} L(\theta, \phi)$ can be estimated easily with Monte-Carlo. Indeed, under some weak assumptions, the expectation and gradient operators can be permuted and we have:
$\nabla_{\theta} L(\theta, \phi) = \nabla_{\theta}\mathbf{E}_{x\sim p_\phi(x)}[f_{\theta}(x)] =
\mathbf{E}_{x\sim p_\phi(x)}[\nabla_{\theta} f_{\theta}(x)] \approx
\frac{1}{|S|} \sum_{s=1}^S \nabla_{\theta} f_{\theta}(x^{(s)})$
where $x^{{(s)}}\sim p_\phi(x)$ are $S$ independent samples.
- For the second gradient $\nabla_{\phi} L(\theta, \phi)$ however, there is in general **no obvious way to compute the gradient**, because the distribution under which the expectation is taken depends on $\phi$. In order to learn the parameters $\phi$, one needs to backpropagate either through the distribution $p_\phi(x)$
or through samples $x^{s}\sim p_\phi(x)$ from that distribution.

In this blog post I give a quick review of some common methods used to deal with backpropagating through continuous and discrete samples.


## All in One Table

The table below sums up some ways to deal with samples in a computation graph. Everything in **bold** is either more powerful or less constraining. In the context of deep learning, the most important attributes are that the loss is differentiable w.r.t. $\phi$, so that the parameters $\phi$ can be learned using gradient descent.

| Method | Continuous / Discrete | Differentiable w.r.t $\phi$ | Follows exact distribution $p_\phi(x)$ | $\frac{\partial f_\theta(x)}{\partial x}$ must exist |
| :--- | :--- | :--- | :--- | :---|
| Score function estimator | Continuous and discrete | **Yes** | Yes | **No** |
| Reparameterization trick | Continuous | **Yes** | Yes | Yes |
| Gumbel-max trick | Discrete | No | **Yes** | |
| Gumbel-softmax trick | Discrete | **Yes** | No (continuous relaxation) | Yes |
| ST-Gumbel esimator | Discrete | **Yes** | **Yes** on forward pass<br>No on backward pass (continuous relaxation) | Yes |
| REBAR | Discrete | **Yes** | **Yes** on forward pass<br>No on backward pass (continuous relaxation) | ? |




## Score function estimator trick

The **score function estimator** (SF), also called **REINFORCE** when applied to reinforcement learning, and **likelihood-ratio estimator** transforms an integral into an expectation.

Rewriting the expectation as an integral gives
$$\nabla_{\phi} L(\theta, \phi)
= \nabla_{\phi} \int_x f_{\theta}(x)  p_\phi(x) dx
= \int_x f_{\theta}(x) \nabla_{\phi} p_\phi(x) dx$$

The right hand side no longer corresponds to an expectation, because there is no probability measure anymore inside the integral after differentiating $p_\phi(x)$.

However, using the property that $\nabla_{\phi} \log p_\phi(x) = \frac {\nabla_{\phi} p_\phi(x)}{p_\phi(x)}$ we can make the probability measure appear:
$$\nabla_{\phi} L(\theta, \phi)
= \int_x f_{\theta}(x) \nabla_{\phi} p_\phi(x) dx
= \int_x f_{\theta}(x) \nabla_{\phi} \log p_\phi(x) p_\phi(x) dx
$$
and the integral can be rewritten as an expectation:
$$\nabla_{\phi} L(\theta, \phi)=\mathbf{E}_{x\sim p_\phi(x)}[f_{\theta}(x) \nabla_{\phi}\log p_\phi(x)]$$

We can now use Monte-Carlo to estimate the gradient.

### Problems
The problem is that this estimator has been shown to have issues such as high variance, which can make gradient descent algorithms unstable and slow to converge. More specifically, for $x$ with low probability, $\nabla_{\phi} \log p_\phi(x) = \frac {\nabla_{\phi} p_\phi(x)}{p_\phi(x)}$ can become very large.

This problem can be partially alleviated by subtracting a **control variate** $b(x)$ to $f_\theta(x)$ and adding its mean back:
$\nabla_{\phi} L(\theta, \phi)
=\nabla_{\phi}\mathbf{E}_{x\sim p_\phi(x)}[(f_{\theta}(x)-b(x)) \log p_\phi(x)] + \mu_b$

### Applications

- Extreme value theory
- Reinforcement learning; It is then known as REINFORCE. Usually, $x$ is a discrete action and $f_\theta(x)$ some kind of value function, which is usually not differentiable w.r.t $x$. Fortunately, REINFORCE **does not require that** $f_\theta(x)$ be differentiable w.r.t $x$, which makes it applicable in reinforcement learning.

### Links and References


## Reparameterization trick

Sometimes the random variable $x\sim p_\phi(x)$ can be **reparameterized** as a deterministic function $g$ of $\phi$ and of a random variable $\epsilon\sim p(\epsilon)$, where $p(\epsilon)$ does not depend on $\phi$:

$$x=g(\phi,\epsilon)$$

For instance the Gaussian variable $x\sim \mathcal N(\mu(\phi), \sigma^2(\phi))$ can be rewritten as a function of a standard Gaussian variable $\epsilon\sim \mathcal N(0,1)$, such that $x = \mu(\phi) + \sigma^2(\phi) * \epsilon$.

In that case the gradient rewrites as

$\nabla_{\phi} L(\theta, \phi)
= \nabla_{\phi}\mathbf{E}_{x\sim p_\phi(x)}[f_{\theta}(x)]
= \nabla_{\phi}\mathbf{E}_{\epsilon\sim p(\epsilon)}[f_{\theta}(g(\phi, \epsilon)]
= \mathbf{E}_{\epsilon\sim p(\epsilon)}[\nabla_{\phi} f_{\theta}(g(\phi, \epsilon)] \\
\nabla_{\phi} L(\theta, \phi)
= \mathbf{E}_{\epsilon\sim p(\epsilon)}[{f'}_\theta(g(\phi,\epsilon)) \nabla_{\phi} g(\phi, \epsilon)]$

### Comments

* $f_\theta(x)$ **must be differentiable** w.r.t $x$ its input. This was not the case for the score function estimator.
* $g(\phi, \epsilon)$ **must exist and be differentiable** w.r.t. $\phi$. This not obvious for discrete categorical variables $x\sim \mathcal{Cat}(\pi_\phi)$. However, for discrete variables, we will see that:
* the **Gumbel-max trick** does provide a $g$ although it is nondifferentiable w.r.t. $\phi$
* the **Gumbel-softmax trick** is a relaxation of the Gumbel-max trick that provides

### Applications

- Training variational autoencoders VAE with continuous latent variables. See [Kingma & Welling (2014), Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114).
- Training Generative Adversarial Networks with continuous samples. The generator is an implicit model which defines a distribution $x=g(\phi, \epsilon)$. More details in the original GAN paper [Goodfellow et al. (2014), Generative Adversarial Nets](http://papers.nips.cc/paper/5423-generative-adversarial-nets.pdf).
