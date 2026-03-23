import textstat
import spacy

# load NLP model
nlp = spacy.load("en_core_web_sm")

# get text from terminal
print("Paste your text below (press Enter twice when done):")
lines = []
while True:
    line = input()
    if line == "":
        break
    lines.append(line)

text = " ".join(lines)

doc = nlp(text)

print("\n--- Analysis Results ---\n")

# Check sentence length
for sentence in doc.sents:
    word_count = len(sentence.text.split())

    if word_count > 25:
        print("⚠ Long sentence detected:")
        print(sentence.text)
        print(f"Words: {word_count}\n")

# Check readability
try:
    readability = textstat.flesch_kincaid_grade(text)
    print(f"Readability Grade Level: {readability}")

    if readability > 10:
        print("⚠ Text may be too complex for some readers.\n")
except Exception:
    print("⚠ Readability score could not be calculated right now.\n")

# Check paragraph density
paragraphs = text.split("\n")

for para in paragraphs:
    word_count = len(para.split())

    if word_count > 120:
        print("⚠ Dense paragraph detected.\n")