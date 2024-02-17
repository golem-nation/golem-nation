FROM python:3.9

COPY . .

RUN apt-get update && \
    apt-get install -y ffmpeg && \
    pip install --no-cache-dir -r requirements.txt

VOLUME /golem/work/input
VOLUME /golem/work/output

CMD ["python", "main.py", "--input", "input", "--output", "output", "--ss", "100", "--thread", "5"]
