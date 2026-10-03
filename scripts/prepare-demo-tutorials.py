from pathlib import Path
import subprocess

out = Path('public/media')
out.mkdir(parents=True, exist_ok=True)
clips = {
    'blot': ('IMG_7247.MOV', 11, 14),
    'ph': ('IMG_7275.MOV', 96, 48),
    'scent': ('IMG_7242.MOV', 7, 15),
}
captions = {
    'blot': {
        'en': 'Press the blotting sheet onto your T-zone. Do not rub.\nThen lift it and lay it on the black area of the current board.',
        'zh-Hant': '把吸油紙按在 T 字位，不要擦。\n然後提起，放在最新蓋板的黑色區域。',
        'zh-Hans': '把吸油纸按在 T 字位，不要擦。\n然后提起，放在最新盖板的黑色区域。',
    },
    'ph': {
        'en': 'Prepare water on your inner forearm and in the control dish.\nUse the written steps for the two strips and the 60-second timing.',
        'zh-Hant': '在前臂內側與對照玻璃碟準備水滴。\n兩張試紙的操作及六十秒計時，請依照文字步驟。',
        'zh-Hans': '在前臂内侧与对照玻璃碟准备水滴。\n两张试纸的操作及六十秒计时，请依照文字步骤。',
    },
    'scent': {
        'en': 'Smell the scented strip gently.\nRate how much you like it and how strong it feels separately.',
        'zh-Hant': '輕輕嗅聞試香紙。\n分別評分你有多喜歡，以及香氣的強度。',
        'zh-Hans': '轻轻嗅闻试香纸。\n分别评分你有多喜欢，以及香气的强度。',
    },
}
for kind, (filename, start, duration) in clips.items():
    source = Path('videos/Additional Stock Footage') / filename
    video = out / f'demo-tutorial-{kind}.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(start), '-i', str(source), '-t', str(duration), '-map', '0:v:0', '-an', '-vf', 'scale=960:-2,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '25', '-movflags', '+faststart', str(video)], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', '1', '-i', str(video), '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', str(out / f'demo-tutorial-{kind}.webp')], check=True)
    for locale, caption in captions[kind].items():
        end = f'00:00:{duration:02d}.000'
        (out / f'demo-tutorial-{kind}-{locale}.vtt').write_text(f'WEBVTT\n\n00:00:00.000 --> {end}\n{caption}\n', encoding='utf-8')
    print(video, round(video.stat().st_size / 1024 / 1024, 2), 'MiB')
