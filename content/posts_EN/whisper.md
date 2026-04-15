---
title: "📢 How can you batch-transcribe audio into text efficiently?"
date: 2024-10-21T00:26:58+08:00
summary: "How to transcribe local audio files from the CLI without using an LLM."
categories: 
  - 帮助
tags: 
  - 技术
---



# The Whisper Model

This arose from an ENG1001 assignment at CUHKSZ that required a reflection presentation on a TED Talk video. I did not want to take notes while listening, and real-time transcription felt both too slow and not accurate enough.



### Install Whisper

1. Make sure the Whisper package is installed in your Python environment. If you are using a virtual environment, activate it first:

```shell
# If you are using conda
conda activate <your environment>
# Or if you are using virtualenv
source venv/bin/activate
```

It is advisable to run Whisper in an isolated environment so that long transcription jobs do not interfere with your system or create package conflicts.



2. Install Whisper with the following command:

```shell
pip install git+https://github.com/openai/whisper.git
```

Then verify that Whisper was installed correctly:

```shell
pip show whisper
```

Under normal circumstances, you should see output like this:

```shell
Name: whisper
Version: x.x.x
Location: /path/to/python/site-packages
```




### Run the code

1. Navigate to the parent directory of the video you want to transcribe.



2. Suppose your video file is named `video.mp4`. First create a Python file in the terminal with `touch`. Be careful not to name the file `whisper`. Then put the following code into that file and save it:

```python
import whisper

model = whisper.load_model("base")
result = model.transcribe("video.mp4")
# Replace video.mp4 with the actual name of your video file

print(result["text"])
```



3. Run the Python file in the terminal. After a short wait (for a 10-minute video, about 40 seconds), the terminal will print the transcribed text.
