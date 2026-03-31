import warnings
import os

warnings.filterwarnings(
    "ignore",
    message=".*only supports OpenSSL 1.1.1\\+.*",
    category=Warning,
    module="urllib3",
)

#nlp imports
import spacy
import textstat
from wordfreq import zipf_frequency

# Constant
WORD_RARITY_THRESHOLD = 3

#just reading the file
def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def word_difficulty(word):
    score = 0

    # Rare word
    if zipf_frequency(word, "en") < WORD_RARITY_THRESHOLD:
        score += 2

    # Long word
    if textstat.syllable_count(word) >= 3:
        score += 0.25

    return score

#logic for storing + finding flags (Vishalkiran)
def flagCheck(text):
    flags = []
    triggered_text = []

    try:
        nlp = spacy.load("en_core_web_sm")
        doc = nlp(text)
    except Exception:
        flags.append("NLP model could not be loaded.")
        return flags, triggered_text
    
    # Checks for long and 
    # Short sentences (Ryan)
    for sentence in doc.sents:
        sentence_text = sentence.text.strip()

        #words = sentence_text.split()
        words = [token.text.lower() for token in sentence if token.is_alpha]

        word_count = len(words)
        
        rare_word_count = sum(1 for word in words if zipf_frequency(word, "en") < WORD_RARITY_THRESHOLD)

        sentence_difficulty = sum(word_difficulty(word) for word in words)

        if word_count < 8:

            #---- UNDERFLAGGING TRUE POSITIVES ----
            difficulty_per_word = sentence_difficulty / word_count

            if difficulty_per_word >= 0.65 or rare_word_count >= 2:
                flags.append(f"Short complex sentence detected (difficulty {sentence_difficulty}): {sentence_text}")
            
            #---- OVERFLAGGING FALSE POSITIVES ----
            #long_word_count = sum(
            #    1 for word in words
            #    if textstat.syllable_count(word) >= 3
            #)

            #if rare_word_count >= 2 or (rare_word_count >= 1 and long_word_count >= 2):
            #    flags.append(
            #        f"Complex short sentence detected: {sentence_text}"
            #    )

        if word_count > 25:
            flags.append(
                f"Long sentence detected ({word_count} words): {sentence_text}"
            )
            triggered_text.append(sentence_text)


    #checking kincaid grade for each specific sentence itself
    for sentence in doc.sents:
        sentence_text = sentence.text.strip()
        if not sentence_text:
            continue
        try:
            readability = textstat.flesch_kincaid_grade(sentence_text)
            if readability > 10:
                #flags.append(
                #    f"High complexity sentence (grade {readability:.2f}): {sentence_text}"
                #)
                triggered_text.append(sentence_text)
        except Exception:
            flags.append("Readability score could not be calculated for a sentence.")

    #checking for long words (avg syllables per word)
    for sentence in doc.sents:
        sentence_text = sentence.text.strip()
        if not sentence_text:
            continue
        words = sentence_text.split()
        if not words:
            continue
        long_words = [w for w in words if len(w) >= 10]
        if len(long_words) >= 2:
            flags.append(f"Long words detected {long_words[:3]}: {sentence_text}")
            triggered_text.append(sentence_text)

    #checking for dense paras
    paragraphs = text.split("\n")
    for para in paragraphs:
        word_count = len(para.split())
        if word_count > 120:
            flags.append(f"Dense paragraph detected ({word_count} words).")
            triggered_text.append(para.strip())
    #return stored flags + triggered text
    return flags, triggered_text


if __name__ == "__main__":
    import sys

    if len(sys.argv) == 2:
        file_path = sys.argv[1]
    else:
        file_path = input("Enter path to text file: ").strip()
        if not file_path:
            print("No file path provided.")
            raise SystemExit(1)

    try:
        result = process_file(file_path)
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        raise SystemExit(1)

    detected_flags, triggered_text = flagCheck(result)
    for flag in detected_flags:
        print()
        print(flag)
        print()

    base, ext = os.path.splitext(file_path)
    output_path = f"{base}_flagged{ext or '.txt'}"

    with open(output_path, "w", encoding="utf-8") as out_file:
        if triggered_text:
            out_file.write("\n\n".join([chunk for chunk in triggered_text if chunk]))

    print(f"Flagged text file written to: {output_path}")

