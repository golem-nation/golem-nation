from unsilence import Unsilence
import argparse
import os
import ffmpeg


def unsilence_videos(files: list, output: str, ss: int, threads: int):
    print(f"files to render {len(files)}")
    i = 0
    for file_name in files:
        u = Unsilence(file_name)
        u.detect_silence()
        u.render_media(f"{output}/{os.path.basename(file_name).split('/')[-1]}", silent_speed=ss, threads=threads)
        print(f"file {i} rendered")
        i += 1

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Remove silent parts of a video')
    parser.add_argument('--threads', type=int, help='Specify how many threads to use')
    parser.add_argument('--ss', type=int, help='Specify silent speed amount')
    parser.add_argument('--sv', type=int, help='The volume of silent parts')
    parser.add_argument('--av', type=int, help='The volume of audible parts')
    parser.add_argument('--input', type=str, help='The input directory')
    parser.add_argument('--output', type=str, help='The output directory')
    args = parser.parse_args()

    input = "input"
    output = "output"
    if args.input:
        input = args.input
    if args.output:
        output = args.output

    if os.path.isdir(input) != True:
        os.makedirs(input)
    if os.path.isdir(output) != True:
        os.makedirs(output)

    file_names = []
    for root, dirs, files in os.walk(input):
        for file in files:
            file_names.append(os.path.join(root, file))

    threads=1
    ss=8
    if args.ss:
        ss = args.ss
    if args.threads:
        threads = args.threads

    unsilence_videos(files=file_names, output=output, ss=ss, threads=threads)
    print("Videos rendered!")
