import sys
import os
import json

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from backend.services.compiler import WordDocumentCompiler

user_json = {
  "data": [
    {
      "title_prefix": "II.",
      "t": "wb",
      "x": "Complete the sentences with the words from the box.",
      "fmt": "1.",
      "w": [
        "photos",
        "fishing",
        "hobbies",
        "music",
        "jogging",
        "gardening",
        "painting",
        "model cars",
        "swimming",
        "yoga"
      ],
      "k": [
        {
          "q": "1",
          "x": "She usually goes _______ with her friends in the pool near her school.",
          "a": "swimming"
        },
        {
          "q": "2",
          "x": "Sarah likes _______. She plants lots of flowers and vegetables in her home garden.",
          "a": "gardening"
        },
        {
          "q": "3",
          "x": "Every weekend, I go _______ in my uncle's boat, or just off the shoreline.",
          "a": "fishing"
        },
        {
          "q": "4",
          "x": "In later years, he took up _______ as a hobby. He drew watercolour landscapes.",
          "a": "painting"
        },
        {
          "q": "5",
          "x": "My hobby is listening to _______. It can help relax my mind.",
          "a": "music"
        },
        {
          "q": "6",
          "x": "I have recently started a new hobby – making _______.",
          "a": "model cars"
        },
        {
          "q": "7",
          "x": "Most people take _______ and post them on their social networking accounts.",
          "a": "photos"
        },
        {
          "q": "8",
          "x": "Photography and gardening are among my father's _______.",
          "a": "hobbies"
        },
        {
          "q": "9",
          "x": "Doing _______ in the morning helps to wake up your body after a long sleep.",
          "a": "yoga"
        },
        {
          "q": "10",
          "x": "I usually go _______ in the morning when the air is still fresh.",
          "a": "jogging"
        }
      ]
    },
    {
      "title_prefix": "III.",
      "t": "wb",
      "x": "Put the words into the correct column.",
      "w": [
        "skating",
        "camping",
        "football",
        "swimming",
        "stamps",
        "badges",
        "gymnastics",
        "chess",
        "gardening",
        "books",
        "model cars",
        "crossword",
        "sports",
        "judo",
        "aerobics",
        "jogging",
        "dolls",
        "board games",
        "coins",
        "badminton",
        "tennis",
        "fishing",
        "cycling",
        "yoga"
      ],
      "k": [
        {
          "q": "1",
          "x": "PLAY:",
          "a": "football, chess, sports, dolls, board games, badminton, tennis"
        },
        {
          "q": "2",
          "x": "GO:",
          "a": "skating, camping, swimming, jogging, fishing, cycling"
        },
        {
          "q": "3",
          "x": "DO:",
          "a": "gymnastics, gardening, judo, aerobics, crossword, yoga"
        },
        {
          "q": "4",
          "x": "COLLECT:",
          "a": "stamps, badges, books, model cars, coins"
        }
      ]
    },
    {
      "title_prefix": "II.",
      "t": "mt",
      "x": "Read the text carefully, then do the tasks.\n\n**A. Match each word with its meaning.**",
      "b": "Our life would be hard without rest and recreation. And people have many different ideas of how to spend their free time. If you enjoy doing a thing or activity in your free time, then you have a hobby. A hobby is an activity, interest, enthusiasm, or pastime that is undertaken for pleasure or relaxation, done during one's own time. A person's hobbies depend on his age, character and personal interests. An interesting thing to one person can be boring to another. That's why some people prefer reading, cooking, knitting, collecting, playing a musical instrument, photography or playing computer games while others prefer dancing, travelling, camping or sports.",
      "fmt": "1.",
      "layout": "match",
      "o": [
        "rest",
        "recreation",
        "interest",
        "enthusiasm",
        "relaxation",
        "pleasure"
      ],
      "p": [
        "a. an activity that you enjoy doing",
        "b. a strong feeling of excitement and interest in something",
        "c. a feeling of happiness, enjoyment, or satisfaction",
        "d. a period of relaxing, sleeping or doing nothing",
        "e. the fact of people doing things for enjoyment",
        "f. a way of resting and enjoying yourself"
      ],
      "a": [
        "d",
        "e",
        "a",
        "b",
        "f",
        "c"
      ]
    },
    {
      "title_prefix": "VI.",
      "t": "rw",
      "x": "There is one mistake in each sentence. Underline and correct the mistake.",
      "fmt": "1.",
      "layout": "blank_right",
      "k": [
        {
          "q": "1",
          "x": "Nam is my [classmates]. He watches TV every night.",
          "a": "classmates → classmate"
        },
        {
          "q": "2",
          "x": "I think collecting stamps [are] interesting.",
          "a": "are → is"
        },
        {
          "q": "3",
          "x": "My dad cooks very [good]. He loves preparing meals for our family.",
          "a": "good → well"
        },
        {
          "q": "4",
          "x": "I enjoy [to ride] my bike to school.",
          "a": "to ride → riding"
        },
        {
          "q": "5",
          "x": "We usually go [in] a small lake out of the city at weekends.",
          "a": "in → to"
        },
        {
          "q": "6",
          "x": "I don't [collecting] anything for a hobby.",
          "a": "collecting → collect"
        },
        {
          "q": "7",
          "x": "We like [doing] fishing because it is relaxing.",
          "a": "doing → going"
        },
        {
          "q": "8",
          "x": "[Do] your sister find bird-watching interesting?",
          "a": "Do → Does"
        }
      ]
    }
  ]
}

out_dir = r"C:\Users\ACER\Desktop\Center_Manager_App\workspace_files"
os.makedirs(out_dir, exist_ok=True)
out_file = os.path.join(out_dir, "Test_User_Payload.docx")

compiler = WordDocumentCompiler()
compiler.compile(user_json["data"], out_file, is_test=True)

print(f"SUCCESS: Compiled DOCX saved at {out_file}")
print(f"File exists: {os.path.exists(out_file)}, Size: {os.path.getsize(out_file)} bytes")
