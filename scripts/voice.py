"""Record every line the game says with Kokoro TTS: public/voice/<hash>.mp3 plus public/voice/index.json (text -> hash).

    uv run --with "kokoro>=0.9.4" --with "misaki[zh]" --with soundfile python scripts/voice.py   (needs node and ffmpeg)

Only lines without a clip yet are recorded, so re-running after adding vocabulary is quick. Clips nobody uses any
more are deleted. Phonemes are built from the game's own pinyin (scripts/voice-lines.ts), not guessed from the
characters, so every word sounds the way the game spells it.
"""
import hashlib, json, os, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from kokoro import KPipeline
from misaki.zh import ZHG2P

SPEED, RATE, TARGET_DB = 0.9, 24000, -23.5
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'voice')
PUNCT = {'。': '.', '！': '!', '？': '?', '，': ',', '：': ':'}


def phonemes(py: str) -> str:
    """'wo3|kan3|le5|。' -> Kokoro's phoneme string: one space-separated chunk per word, punctuation attached"""
    out = ''
    for tok in py.split('|'):
        if tok in PUNCT:
            out = out.rstrip() + PUNCT[tok] + ' '
        elif tok.strip() in ('', '+'):
            continue
        elif tok[-1].isdigit():  # a known word: "mu4 tou5"
            out += ''.join(ZHG2P.py2ipa(s) for s in tok.split()) + ' '
        else:  # a character the game does not teach: let pypinyin read it
            out += ZHG2P.word2ipa(tok) + ' '
    out = out.strip().replace(chr(815), '')
    return out if out[-1:] in '.!?' else out + '.'  # a full stop makes single words come out whole


def trim(a: np.ndarray) -> np.ndarray:
    """cut leading and trailing silence, keep 60 ms either side"""
    loud = np.nonzero(np.abs(a) > 0.01)[0]
    if not len(loud): return a
    pad = int(0.06 * RATE)
    return a[max(0, loud[0] - pad):loud[-1] + pad]


def alone(l) -> bool:
    """one character with a full tone (四): said on its own Kokoro gets the tone wrong more often than right"""
    return len(l['text']) == 1 and l['py'][-1:] in '1234'


def say(pipe, l) -> np.ndarray:
    if not alone(l):
        return trim(np.concatenate([r.audio.numpy() for r in pipe.generate_from_tokens(phonemes(l['py']), voice=l['voice'], speed=SPEED)]))
    # said inside 这是X字。 and cut back out at Kokoro's own phoneme durations (from 20 ms early: the boundary falls a
    # little into the first consonant). One-character words with tone 1, 2 or 4 whose pitch slope fits the tone: 36 of
    # 102 alone, 75 framed (macOS's Tingting: 80). Longer words are not framed: their tones improved too, but Whisper
    # understood them less often (5 of 30 against 9)
    pre, word = phonemes('zhe4|shi4')[:-1] + ' ', phonemes(l['py'])[:-1]
    r = next(iter(pipe.generate_from_tokens(pre + word + ' ' + phonemes('zi4'), voice=l['voice'], speed=0.7)))  # slower: same tones, a longer syllable
    a, dur = r.audio.numpy(), r.pred_dur.numpy()  # frames per phoneme, plus a start and an end token
    per = len(a) / dur.sum()
    a = a[int(dur[:1 + len(pre)].sum() * per - 0.02 * RATE):int(dur[:1 + len(pre) + len(word)].sum() * per)].copy()
    fade = min(len(a) // 4, int(0.012 * RATE))  # no clicks at the cuts
    a[:fade] *= np.linspace(0, 1, fade); a[-fade:] *= np.linspace(1, 0, fade)
    return np.concatenate([np.zeros(int(0.03 * RATE)), a, np.zeros(int(0.06 * RATE))])


def main():
    lines = json.loads(subprocess.check_output(['node', os.path.join(ROOT, 'scripts', 'voice-lines.ts')], cwd=ROOT))
    os.makedirs(OUT, exist_ok=True)
    index = {l['key']: hashlib.sha1((l['voice'] + l['py'] + ('|framed 0.7 -20ms' if alone(l) else '')).encode()).hexdigest()[:12] for l in lines}
    todo = {index[l['key']]: l for l in lines if not os.path.exists(os.path.join(OUT, index[l['key']] + '.mp3'))}.values()
    print(f'{len(lines)} lines, {len(todo)} to record', file=sys.stderr)
    pipe = KPipeline(lang_code='z', repo_id='hexgrad/Kokoro-82M')
    with tempfile.TemporaryDirectory() as tmp:
        for i, l in enumerate(todo):
            ps = phonemes(l['py'])
            audio = say(pipe, l)
            wav = os.path.join(tmp, 'a.wav')
            sf.write(wav, audio, RATE)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '40k', os.path.join(OUT, index[l['key']] + '.mp3')], check=True)
            if i % 100 == 0: print(f'{i}/{len(todo)} {l["text"]}  {ps}', file=sys.stderr)
    keep = set(index.values())
    for f in os.listdir(OUT):
        if f.endswith('.mp3') and f[:-4] not in keep: os.remove(os.path.join(OUT, f))
    # the voices differ in loudness by up to 5 dB: louder clips get a playback volume ("file*0.62") that brings them
    # down to the quiet ones (an audio element cannot play louder than its file)
    gain = {}
    for h in set(index.values()):
        a, _ = sf.read(os.path.join(OUT, h + '.mp3'))
        db = 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
        gain[h] = max(0.4, min(1.0, 10 ** ((TARGET_DB - db) / 20)))
    index = {k: h if gain[h] > 0.97 else f'{h}*{gain[h]:.2f}' for k, h in index.items()}
    with open(os.path.join(OUT, 'index.json'), 'w') as f:
        json.dump(index, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)


if __name__ == '__main__':
    main()
