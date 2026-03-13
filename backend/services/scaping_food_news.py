from bs4 import BeautifulSoup
import requests
import random


def scrape_food_news():
     news_list  = [
          "https://www.malaymail.com/news/malaysia/2026/03/13/no-need-to-worry-malaysias-food-supply-stable-for-raya-says-mat-sabu/212502",
          "https://www.freemalaysiatoday.com/category/highlight/2026/03/12/war-disrupts-fertiliser-supplies-puts-food-security-at-risk"
     ]

     random_news = random.choice(news_list)
     headers = {
          "User-Agent": "Mozilla/5.0"
     }

     try:
        response = requests.get(random_news, headers=headers)
        response.raise_for_status()  
        inspect = BeautifulSoup(response.text, "html.parser")
        container_classes = [
            "col-md-12", "pad-top-0", "col-span-12 lg:col-span-9"
        ]

        news_container = inspect.find("div", class_ = container_classes)


        # Initialize header to None
        header_tag = None

        if news_container:
            # Try to find H1 inside the container
            header_tag = news_container.find("h1")

        # FALLBACK: If container wasn't found OR didn't have an H1
        if not header_tag:
            # Look for ANY H1 on the page (usually the headline)
            header_tag = inspect.find("h1")
        
        # FINAL SAFETY: If H1 is still missing, try H2
        if not header_tag:
            header_tag = inspect.find("h2")

        news_title = header_tag.text.strip() if header_tag else "No title found"
        print(f"News Title: {news_title}")


     
     except Exception as e:
          print(f"An error occurred: {e}")


     return news_title


if __name__ == "__main__":
    scrape_food_news()