import argparse
import os
import re
import sys
import soundfile as sf
from kokoro_onnx import Kokoro


def smooth_indonesian_text(text):
    """Haluskan glottal stop & pemecah kalimat agar intonasi Kokoro mengalir tanpa terpotong."""
    replacements = [
        (r"\bkakak\b", "kaka"),
        (r"\bbanyak\b", "banyaa"),
        (r"\bmakasih\b", "makasii"),
        (r"\bcantik\b", "cantii"),
        (r"\basik\b", "asiiik"),
        (r"\bbanget\b", "bangeet"),
        (r"\benggak\b", "engga"),
    ]
    out = text
    for pattern, repl in replacements:
        out = re.sub(pattern, repl, out, flags=re.IGNORECASE)
    # Ganti tanda seru di tengah kalimat menjadi koma agar disintesis dalam satu tarikan napas
    out = re.sub(r"!+(?=\s+\S)", ",", out)
    return out


def resolve_voice(kokoro, voice_spec):
    """Dukung single voice ('jf_alpha') atau blend berbobot ('jf_nezumi:0.6,af_heart:0.4')."""
    if ":" not in voice_spec and "," not in voice_spec:
        return voice_spec

    blended = None
    total_weight = 0.0
    for part in voice_spec.split(","):
        part = part.strip()
        if not part:
            continue
        if ":" in part:
            name, weight_str = part.split(":", 1)
            weight = float(weight_str.strip())
        else:
            name = part
            weight = 1.0
        style = kokoro.get_voice_style(name.strip())
        blended = style * weight if blended is None else blended + (style * weight)
        total_weight += weight

    if blended is not None and total_weight > 0 and abs(total_weight - 1.0) > 1e-6:
        blended = blended / total_weight
    return blended if blended is not None else voice_spec


def main():
    parser = argparse.ArgumentParser(description="Offline Kokoro-ONNX CPU TTS Generator")
    parser.add_argument("--text", required=True, help="Text or phonemes to synthesize")
    parser.add_argument("--voice", default="af_heart", help="Voice ID or weighted blend (e.g., jf_nezumi:0.6,af_heart:0.4)")
    parser.add_argument("--lang", default="en-us", help="Language code (en-us, en-gb, ja, id)")
    parser.add_argument("--speed", type=float, default=1.05, help="Speech speed")
    parser.add_argument("--phonemes", action="store_true", help="Treat --text directly as IPA phonemes")
    parser.add_argument("--out", required=True, help="Output WAV file path")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "models_tts", "kokoro-v1.0.int8.onnx")
    voices_path = os.path.join(base_dir, "models_tts", "voices-v1.0.bin")

    if not os.path.exists(model_path) or not os.path.exists(voices_path):
        print("Error: Kokoro model files missing in models_tts/", file=sys.stderr)
        sys.exit(1)

    kokoro = Kokoro(model_path, voices_path)
    voice_param = resolve_voice(kokoro, args.voice)
    synth_text = args.text
    if not args.phonemes and args.lang == "id":
        synth_text = smooth_indonesian_text(synth_text)

    samples, sample_rate = kokoro.create(
        synth_text,
        voice=voice_param,
        speed=args.speed,
        lang=args.lang,
        is_phonemes=args.phonemes,
        trim=False,
        sentence_pause=0.0,
        clause_pause=0.0,
    )

    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    sf.write(args.out, samples, sample_rate)
    print(f"OK:{args.out}")


if __name__ == "__main__":
    main()
