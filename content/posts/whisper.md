---
title: "# 如何快速批量地将音频转文字？"
date: 2024-10-21T00:26:58+08:00
categories: 
  - 帮助
tags: 
  - 技术
---



# Whisper 模型

事情的起因是龙大 ENG1001 课程需要就 TedTalk 视频进行 Reflection Presentation。但我懒得边听边记，实时转录文字太慢又不太准确。



### 下载 Whisper

1、确保你在 Python 环境中安装 Whisper 包。如果你使用的是虚拟环境，先激活虚拟环境：

```shell
# 如果你使用的是 conda
conda activate <your environment>
# 或者使用 virtualenv
source venv/bin/activate
```

建议在隔离环境中运行，防止转录长视频时把系统卡死(虽然不太可能)或者与其他的包不兼容。



2、输入安装 Whisper 的命令：

```shell
pip install git+https://github.com/openai/whisper.git
```

运行以下命令，确认 Whisper 是否安装正确：

```shell
pip show whisper
```

正常来说，因该看到以下输出：

```shell
Name: whisper
Version: x.x.x
Location: /path/to/python/site-packages
```





### 代码运行

1、导航到你需要转文字的视频的上一级目录下。



2、假设你的视频文件是“video.mp4"，先在终端 touch 一个 Python 文件，注意文件名不能叫做”whisper“。在文件中输入以下内容，并保存：

```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("video.mp4")
# 把 video.mp4 替换为你的视频名

print(result["text"])
```



3、在终端中运行上述 Python 代码文件，等待一会(10分钟的视频需要大约40秒)，终端会输出转换出的文本。
