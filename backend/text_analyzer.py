import warnings
import os
import re

# Naysa - normalize acronyms & abbreviations before FK scoring
def normalize_acronyms_abbrevs(text):
    abbrevs = {
        r'\bDr\.': 'Doctor',
        r'\bMr\.': 'Mister',
        r'\bMrs\.': 'Missus',
        r'\bMs\.': 'Miss',
        r'\bProf\.': 'Professor',
        r'\bSt\.': 'Saint',
        r'\betc\.': 'et cetera',
        r'\bvs\.': 'versus',
        r'\be\.g\.': 'for example',
        r'\bi\.e\.': 'that is',
        r'\bapprox\.': 'approximately',
        r'\bJan\.': 'January',
        r'\bFeb\.': 'February',
        r'\bMar\.': 'March',
        r'\bApr\.': 'April',
        r'\bAug\.': 'August',
        r'\bSept\.': 'September',
        r'\bOct\.': 'October',
        r'\bNov\.': 'November',
        r'\bDec\.': 'December',
        r'\best\.': 'established',
        r'\bfig\.': 'figure',
        r'\bno\.': 'number',
        r'\bSr\.': 'Senior',
        r'\bJr\.': 'Junior'
    }
    for pattern, replacement in abbrevs.items():
        text = re.sub(pattern, replacement, text)
    text = re.sub(r'\b[A-Z]{2,}\b', 'agency', text)
    return text.strip()

# Naysa - normalize numbers & dates before FK scoring
def normalize_numbers_dates(text):
    text = re.sub(r'\$?[\d,]+\.?\d*%?', '', text)
    text = re.sub(r'\b\d{4}\b', '', text)
    text = re.sub(r'\b\d+(st|nd|rd|th)\b', '', text)
    text = re.sub(r' {2,}', ' ', text)
    text = re.sub(r' ([,\.\!\?;:])', r'\1', text)
    return text.strip()

#nlp imports
import spacy
import textstat
from wordfreq import zipf_frequency

warnings.filterwarnings(
    "ignore",
    message=".*only supports OpenSSL 1.1.1\\+.*",
    category=Warning,
    module="urllib3",
)

# Constants
WORD_RARITY_THRESHOLD = 3
KINCAID_THRESHOLD = 10

#just reading the file
def process_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def word_difficulty(word):
    score = 0

    # Rare word
    if zipf_frequency(word, "en") < WORD_RARITY_THRESHOLD:
        score += 2

    # Long word (weighted less)
    if textstat.syllable_count(word) >= 3:
        score += 0.25

    return score

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = None

#logic for storing + finding flags (Vishalkiran)
def flagCheck(text):

    flags = []
    triggered_text = []

    if nlp is None:
        flags.append("NLP model could not be loaded.")
        return flags, triggered_text
    
    doc = nlp(text)
    
    # Checks by short, long, and medium length sentences (Ryan)
    for sentence in doc.sents:
        
        sentence_text = sentence.text.strip()
        if not sentence_text:
            continue

        normalized_sentence_text = normalize_numbers_dates(normalize_acronyms_abbrevs(sentence_text))

        # Runs tokenizer on normalized text
        words = [token.text.lower() for token in nlp.make_doc(normalized_sentence_text) if token.is_alpha]

        if not words:
            continue

        word_count = len(words)
        
        rare_word_count = sum(1 for word in words if zipf_frequency(word, "en") < WORD_RARITY_THRESHOLD)

        sentence_difficulty = sum(word_difficulty(word) for word in words)

        difficulty_per_word = sentence_difficulty / word_count

        #----SHORT SENTENCES----
        if word_count < 9:

            #----UNDERFLAGS TRUE POSITIVES----

            if difficulty_per_word >= 0.65 or rare_word_count >= 2:
                flag = f"High complexity short sentence (word difficulty score {sentence_difficulty:.2f}/{word_count}): {sentence_text}"
                flags.append(flag)

                triggered_text.append(flag)
         
            

            #----OVERFLAGS FALSE POSITIVES----
            #long_word_count = sum(1 for word in words if textstat.syllable_count(word) >= 3)
            #if rare_word_count >= 2 or (rare_word_count >= 1 and long_word_count >= 2):
            #    flags.append(f"Complex short sentence detected: {sentence_text}")

        #----MEDIUM SENTENCES----
        elif word_count < 20:
            try:
  
                kincaid_readability = textstat.flesch_kincaid_grade(normalized_sentence_text)
                if kincaid_readability > KINCAID_THRESHOLD + 3:
                    flag = f"High complexity sentence (Kincaid level {kincaid_readability:.2f}): {sentence_text}"
                    flags.append(flag)
                    triggered_text.append(flag)
            

            except Exception:
                flags.append("Readability score could not be calculated for a sentence.")

        #----LONG SENTENCES----
        else:
            flag = f"Long sentence detected ({word_count} words): {sentence_text}"
            flags.append(flag)
            triggered_text.append(flag)
       

            #if difficulty_per_word >= 0.1:

            try:
            
                kincaid_readability = textstat.flesch_kincaid_grade(normalized_sentence_text)
                if kincaid_readability > KINCAID_THRESHOLD + 6:
                    flag = f"High complexity long sentence (Kincaid level {kincaid_readability:.2f}): {sentence_text}"
                    flags.append(flag)
                    triggered_text.append(flag)
              

            except Exception:
                flags.append("Readability score could not be calculated for a sentence.")
        

        # Checking for long words (avg syllables per word)

        long_words = [w for w in words if len(w) >= 10]

        if len(long_words) >= 2:
            flag = f"Long words detected {long_words[:3]}: {sentence_text}"
            flags.append(flag)
            triggered_text.append(flag)
        



    # Checking for dense paragraphs (seperated by a blank line space)
    paragraphs = text.split("\n\n")
    for paragraph in paragraphs:
        word_count = len(paragraph.split())
        if word_count > 120:
            flag = f"Dense paragraph detected ({word_count} words): {paragraph}"
            flags.append(flag)
            triggered_text.append(flag)
            

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
            out_file.write("\n\n".join(triggered_text))

    print(f"Flagged text file written to: {output_path}")

