
<div id="paper-container">
<div id="paper-head">
🔙 <a href="https://gabrielhuang.github.io/">Back to Gabriel Huang's home page</a>
<a href="https://arxiv.org/abs/2110.14711"><h1>A Survey on Few-Shot and <br>Self-Supervised Object Detection</h1></a>
<p>
<a href="https://gabrielhuang.github.io/">Gabriel Huang</a>, 
<a href="https://issamlaradji.github.io/">Issam Laradji</a>,
<a href="http://www.david-vazquez.com/">David Vazquez</a>,
<a href="http://www.iro.umontreal.ca/~slacoste/">Simon Lacoste-Julien</a>,
<a href="https://prlz77.github.io/resume/">Pau Rodriguez</a>
</p>
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=2"><img width="640" src="few-shot-and-self-supervised-object-detection-taxonomy.jpg"></img></a>

<p>
[<a class="cute" href="https://arxiv.org/abs/2110.14711">arXiv</a>]  
[<a class="cute" href="https://arxiv.org/pdf/2110.14711.pdf">PDF</a>]
[<a class="cute" href="https://gabrielhuang.github.io/fsod-survey/">Project page</a>]
[<a class="cute" href="https://github.com/gabrielhuang/awesome-few-shot-object-detection">Awesome Few-Shot Object Detection</a>]
[<a class="cute" href="https://deepai.org/publication/a-survey-of-self-supervised-and-few-shot-object-detection">Deep AI</a>]
</p>

<div style="text-align: justify;">


<h2>Abstract</h2></a>
<p style="text-align: justify;">
Labeling data is often expensive and time-consuming, 
especially for tasks such as object detection and instance segmentation, 
which require dense labeling of the image. 
While few-shot object detection is about training a model on 
novel (unseen) object classes with little data, 
it still requires prior training on many labeled examples of base (seen) classes. 
On the other hand, self-supervised methods aim at learning representations 
from unlabeled data which transfer well to downstream tasks such as object detection. 
Combining <a href="https://arxiv.org/pdf/2110.14711.pdf#page=4">few-shot</a> and <a href="https://arxiv.org/pdf/2110.14711.pdf#page=11">self-supervised</a> object detection is a promising research direction. 
In this survey, we review and characterize the most recent 
approaches on few-shot and self-supervised object detection. 
Then, we give our main <a href="https://arxiv.org/pdf/2110.14711.pdf#page=15">takeaways</a> and discuss future research directions.
</p>

<h2>Tweetorial</h2>
<!-- Also: read and comment on <a href="">Twitter</a> -->
Our <i>tweetorial</i> is summarized below for your convenience. Click on paragraph titles or images for quick links to relevant paper section.
<ol style>
<li><b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=15">The current disorganization of self-supervised 
and few-shot object detection</a></b> have led to *two* Meta-RCNN papers 😱! 
Also, did you know that you can boost your 1-shot Pascal performance by 57% simply by changing your evaluation procedure?
Here we propose a survey to fix it!
Bonus: we also provide lots of interesting insights and future directions.<br>
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=2"><img class="tutorial" src="few-shot-and-self-supervised-object-detection-taxonomy.jpg"></img></a>
</li>
<li><a href="https://arxiv.org/pdf/2110.14711.pdf#page=15"><b>Finetuning is a strong baseline</a></b>. Despite increasingly sophisticated conditioning-based methods being proposed, fine-tuning remains a very strong baseline (TFA, MPSR, DETReg). In fact, most if not all conditioning-based methods perform better when finetuned.<br>
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=15"><img class="tutorial" src="finetuning-meme.jpeg"></img></a>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=15">Heuristics can generate weak labels</a></b>. Several self-supervised methods now rely on training-free computer vision heuristics as training signal. DETReg and SoCo use Selective Search to generate object crops; DETCon compare several heuristics for feature pooling (below)
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=15"><img class="tutorial" src="detcon.jpg"></img></a>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=15">Transformers are everywhere</a></b>. Transformer detection heads such as DETR are increasingly popular due to their simplicity and ability to be trained end-to-end. Moreover, DINO showed that visual transformer backbones can learn semantic segmentation maps without any supervision.
<video class="tutorial" controls Autoplay=autoplay>
<source src="dino.mov" type="video/mp4">
<img src="dino.jpg">
</video>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=9">LEARN HOW I INCREASED MY PASCAL 1-SHOT PERFORMANCE BY 57% WITHOUT DOING ANY WORK!</a></b> That’s right, this is how much discrepancy between benchmarking on Kang’s splits and TFA’s split. In the future, please report those numbers in *separate* columns like below! Also, why does everyone keep using Pascal & COCO trainval as training set and test as validation, instead of using train/val/test splits properly? Find our recommended best practices in the paper!
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=9"><img class="tutorial" src="fsod-table.png"></img></a>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=5">Few-shot classification vs detection</a></b>. Coming from few-shot *classification* and being used to the N-way K-shot episodic framework, I was very confused at first with the few-shot *object detection* framework, which in many ways is closer to transfer learning. We explain the differences between the two in-depth.
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=5"><img class="tutorial" src="fsod-framework.png" style="width: 50%;"></img></a>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=8">Do you actually know how mAP is computed?</a></b> Evaluating object detectors &mdash;let alone few-shot object detectors&mdash; is a nontrivial task. Check out our survey to learn the difference between Pascal VOC and COCO-style mean average precision and how to compute them!
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=8"><img class="tutorial" src="precision-recall.png" style="width: 50%;"></img></a>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=14">Self-supervision *for* object detection</a></b>. Beyond initializing the backbone with MoCo/SimCLR/SwaV, several works now attempt to pretrain the detection heads as well. This seems most useful on few-shot and low-data (e.g. 1%, 5%, 10% COCO) scenarios. Currently one of the top methods, DETReg uses self-supervised representations for few-shot object detection.
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=14"><img class="tutorial" src="ssod-table.png" style="width: 50%;"></img></a>
</li>
<li>
<b><a href="https://arxiv.org/pdf/2110.14711.pdf#page=16">Related tasks</a></b>. Let’s keep a close eye on the related work: zero-shot object detection, weakly-supervised object detection, (few-shot) semantic and instance segmentation, visual commonsense/question answering/captioning, (few-shot) video detection and tracking, multimodal approaches, and more!
<!-- https://github.com/JunweiLiang/Object_Detection_Tracking -->
<a href="https://arxiv.org/pdf/2110.14711.pdf#page=16"><img class="tutorial" src="object-tracking.gif"></img></a>
</li>
</ol>

<h2>Citation</h2>
If our paper was useful to you, please cite us!
<pre><code>@article{huang2021survey,
title={A Survey of Self-Supervised and Few-Shot Object Detection},
author={Huang, Gabriel and Laradji, Issam and Vazquez, David and Lacoste-Julien, Simon and Rodriguez, Pau},
journal={arXiv preprint arXiv:2110.14711},
year={2021}
}</code></pre>
</div>
</div>
</div>
