import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UNIT_CONFIG_FILE = os.path.join(BASE_DIR, "unit_config.json")

DEFAULT_UNIT_DATA = {
    "6": {
        "1": {"name": "My New School", "grammar": "Present Simple & Adverbs of Frequency"},
        "2": {"name": "My House", "grammar": "Possessive Case & Prepositions of Place"},
        "3": {"name": "My Friends", "grammar": "Present Continuous for Future"},
        "4": {"name": "My Neighbourhood", "grammar": "Comparative Adjectives"},
        "5": {"name": "Natural Wonders of Viet Nam", "grammar": "Superlative Adjectives & Modal Verbs (Must/Mustn't)"},
        "6": {"name": "Our Tet Holiday", "grammar": "Modal Verbs (Should/Shouldn't)"},
        "7": {"name": "Television", "grammar": "Conjunctions (And/But/Although)"},
        "8": {"name": "Sports and Games", "grammar": "Past Simple & Imperatives"},
        "9": {"name": "Cities of the World", "grammar": "Possessive Pronouns"},
        "10": {"name": "Our Houses in the Future", "grammar": "Future Simple (Will / Won't)"},
        "11": {"name": "Our Greener World", "grammar": "First Conditional (If + Present Simple, Will + V)"},
        "12": {"name": "Robots", "grammar": "Superlatives of Short/Long Adjectives"}
    },
    "7": {
        "1": {"name": "Hobbies", "grammar": "Present Simple & Verbs of Liking/Disliking"},
        "2": {"name": "Healthy Living", "grammar": "Simple Sentences & Compound Sentences"},
        "3": {"name": "Community Service", "grammar": "Past Simple & Present Perfect"},
        "4": {"name": "Music and Arts", "grammar": "Comparisons (Like, As...as, Different from)"},
        "5": {"name": "Food and Drink", "grammar": "Countable/Uncountable Nouns & Quantifiers (Some/Any)"},
        "6": {"name": "A Visit to a School", "grammar": "Prepositions of Time & Place"},
        "7": {"name": "Traffic", "grammar": "It indicating distance & Used to"},
        "8": {"name": "Films", "grammar": "Connectors (Although/Though/However/In spite of)"},
        "9": {"name": "Festivals around the World", "grammar": "Adverbial Clauses"},
        "10": {"name": "Energy Sources", "grammar": "Future Continuous & Passive Voice"},
        "11": {"name": "Travelling in the Future", "grammar": "Future Possibility (May/Might)"},
        "12": {"name": "English-speaking Countries", "grammar": "Articles (A/An/The) & Zero Article"}
    },
    "8": {
        "1": {"name": "Leisure Time", "grammar": "Verbs of Liking + Gerunds / To-infinitives"},
        "2": {"name": "Life in the Countryside", "grammar": "Comparative Adverbs"},
        "3": {"name": "Teenagers", "grammar": "Simple, Compound, and Complex Sentences"},
        "4": {"name": "Ethnic Groups of Viet Nam", "grammar": "Articles & Questions words"},
        "5": {"name": "Our Customs and Traditions", "grammar": "Modal Verbs (Must, Have to, Should)"},
        "6": {"name": "Lifestyles", "grammar": "Future Tenses Review"},
        "7": {"name": "Environmental Protection", "grammar": "Complex Sentences with Adverb Clauses"},
        "8": {"name": "Shopping", "grammar": "Adverbs of Frequency & Present Simple for Timetables"},
        "9": {"name": "Natural Disasters", "grammar": "Past Continuous & Past Simple with When/While"},
        "10": {"name": "Communication in the Future", "grammar": "Prepositions & Possessive Pronouns"},
        "11": {"name": "Science and Technology", "grammar": "Reported Speech (Statements)"},
        "12": {"name": "Life on Other Planets", "grammar": "Reported Speech (Questions)"}
    },
    "9": {
        "1": {"name": "Local Community", "grammar": "Question Words before To-infinitives & Phrasal Verbs"},
        "2": {"name": "City Life", "grammar": "Comparison of Adjectives and Adverbs"},
        "3": {"name": "Healthy Living for Teens", "grammar": "Modal Verbs in First Conditional"},
        "4": {"name": "Remembering the Past", "grammar": "Used to & Expressing Wishes in the Present"},
        "5": {"name": "Our Experiences", "grammar": "Present Perfect vs Past Simple"},
        "6": {"name": "Vietnamese Lifestyle: Then and Now", "grammar": "Past Continuous & Adverbs"},
        "7": {"name": "Natural Wonders of the World", "grammar": "Passive Voice with Modal Verbs"},
        "8": {"name": "Tourism", "grammar": "Compound Nouns & Defining Relative Clauses"},
        "9": {"name": "World Englishes", "grammar": "Conditional Sentences Type 2"},
        "10": {"name": "Planet Earth", "grammar": "Relative Clauses (Defining & Non-defining)"},
        "11": {"name": "Electronic Devices", "grammar": "Relative Pronouns & Adverbs"},
        "12": {"name": "Career Choices", "grammar": "Review of Tenses & Modals"}
    },
    "10": {
        "1": {"name": "Family Life", "grammar": "Present Simple vs Present Continuous"},
        "2": {"name": "Humans and the Environment", "grammar": "Future with Will & Be going to & Passive Voice"},
        "3": {"name": "Music", "grammar": "Compound Sentences & To-infinitives / Bare Infinitives"},
        "4": {"name": "For a Better Community", "grammar": "Past Simple vs Past Continuous with When/While"},
        "5": {"name": "Inventions", "grammar": "Present Perfect & Gerunds / To-infinitives"},
        "6": {"name": "Gender Equality", "grammar": "Passive Voice with Modal Verbs"},
        "7": {"name": "Viet Nam and International Organisations", "grammar": "Comparative and Superlative Adjectives"},
        "8": {"name": "New Ways to Learn", "grammar": "Relative Clauses (Which, That, Who, Whose)"},
        "9": {"name": "Protecting the Environment", "grammar": "Reported Speech"},
        "10": {"name": "Ecotourism", "grammar": "Conditional Sentences Type 1 & 2"}
    },
    "11": {
        "1": {"name": "A Long and Healthy Life", "grammar": "Past Simple vs Present Perfect"},
        "2": {"name": "The Generation Gap", "grammar": "Modal Verbs (Must, Have to, Should, Ought to)"},
        "3": {"name": "Cities of the Future", "grammar": "Stative Verbs in Continuous Forms & Linking Verbs"},
        "4": {"name": "ASEAN and Viet Nam", "grammar": "Gerunds as Subjects and Objects"},
        "5": {"name": "Global Warming", "grammar": "Present Participle & Past Participle Clauses"},
        "6": {"name": "Preserving Our Heritage", "grammar": "To-infinitive Clauses"},
        "7": {"name": "Education Options for School-leavers", "grammar": "Perfect Gerunds & Perfect Participle Clauses"},
        "8": {"name": "Becoming Independent", "grammar": "Cleft Sentences with It is/was... that"},
        "9": {"name": "Social Issues", "grammar": "Linking Words and Phrases"},
        "10": {"name": "The Ecosystem", "grammar": "Compound Nouns and Compound Adjectives"}
    },
    "12": {
        "1": {"name": "Life Stories We Admire", "grammar": "Past Simple vs Past Continuous & Used to"},
        "2": {"name": "A Multicultural World", "grammar": "Articles Review"},
        "3": {"name": "Green Living", "grammar": "Adverbial Clauses of Condition, Result, and Reason"},
        "4": {"name": "Urbanisation", "grammar": "Subjunctive in That-clauses"},
        "5": {"name": "The World of Work", "grammar": "Adverbial Clauses of Concession and Manner"},
        "6": {"name": "Artificial Intelligence", "grammar": "Active vs Passive Causatives"},
        "7": {"name": "The World of Mass Media", "grammar": "Prepositions after Verbs and Adjectives"},
        "8": {"name": "Wildlife Conservation", "grammar": "Inversion with Negative Adverbials"},
        "9": {"name": "Career Paths", "grammar": "Phrasal Verbs Review"},
        "10": {"name": "Lifelong Learning", "grammar": "Conditionals Review & Mixed Conditionals"}
    }
}


import re

def normalize_unit_entry(val):
    if isinstance(val, dict):
        name = str(val.get("name", "")).strip()
        grammar = str(val.get("grammar", "")).strip()
        raw_topics = val.get("grammar_topics")
        if isinstance(raw_topics, list):
            grammar_topics = [str(t).strip() for t in raw_topics if str(t).strip()]
        elif isinstance(raw_topics, str) and raw_topics.strip():
            grammar_topics = [s.strip() for s in re.split(r'[\n\r,&/]+', raw_topics) if s.strip()]
        elif grammar:
            grammar_topics = [s.strip() for s in re.split(r'[\n\r&/]+', grammar) if s.strip()]
        else:
            grammar_topics = []

        if not grammar and grammar_topics:
            grammar = " & ".join(grammar_topics)

        return {
            "name": name,
            "grammar": grammar,
            "grammar_topics": grammar_topics
        }
    
    val_str = str(val or "").strip()
    return {
        "name": val_str,
        "grammar": "",
        "grammar_topics": []
    }


def load_unit_config():
    """Loads unit configuration with both topic names and grammar topics."""
    if not os.path.exists(UNIT_CONFIG_FILE):
        try:
            with open(UNIT_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(DEFAULT_UNIT_DATA, f, indent=4, ensure_ascii=False)
            return DEFAULT_UNIT_DATA
        except Exception as e:
            print(f"Error initializing unit config: {e}")
            return DEFAULT_UNIT_DATA
    try:
        with open(UNIT_CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)

        updated = False
        normalized_data = {}
        for grade, units in DEFAULT_UNIT_DATA.items():
            normalized_data[grade] = {}
            existing_units = data.get(grade, {})
            for unit_num, def_entry in units.items():
                if unit_num in existing_units:
                    norm = normalize_unit_entry(existing_units[unit_num])
                    # If grammar was empty in user data, keep default grammar suggestion
                    if not norm["grammar"] and def_entry.get("grammar"):
                        norm["grammar"] = def_entry["grammar"]
                        updated = True
                    normalized_data[grade][unit_num] = norm
                else:
                    normalized_data[grade][unit_num] = def_entry
                    updated = True

        # Keep any custom grades user added
        for grade, units in data.items():
            if grade not in normalized_data:
                normalized_data[grade] = {}
                for u_num, u_val in units.items():
                    normalized_data[grade][u_num] = normalize_unit_entry(u_val)

        if updated:
            with open(UNIT_CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(normalized_data, f, indent=4, ensure_ascii=False)
        return normalized_data
    except Exception as e:
        print(f"Error loading unit config: {e}")
        return DEFAULT_UNIT_DATA


def save_unit_config(config_data):
    """Saves unit configuration."""
    try:
        with open(UNIT_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=4, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving unit config: {e}")
        return False
