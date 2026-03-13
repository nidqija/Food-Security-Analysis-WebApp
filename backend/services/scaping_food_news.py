from bs4 import BeautifulSoup
import requests
import random


def scrape_food_news():
     news_list  = [
          "https://www.malaymail.com/news/malaysia/2026/03/13/no-need-to-worry-malaysias-food-supply-stable-for-raya-says-mat-sabu/212502",
          "https://www.freemalaysiatoday.com/category/highlight/2026/03/12/war-disrupts-fertiliser-supplies-puts-food-security-at-risk",
          "https://thesun.my/news/malaysia-news/mco-more-than-enough-food-supply-in-sabah-jeffrey-kitingan-im7934039/",
          "https://themalaysianreserve.com/2025/08/18/malaysia-faces-fresh-food-supply-crisis-if-extreme-heat-persists/",
          "https://www.thestar.com.my/news/nation/2025/11/10/local-food-production-up-but-malaysia-still-import-dependent-says-mat-sabu"
     ]

     random_news = random.choice(news_list)
     headers = {
          "User-Agent": "Mozilla/5.0"
     }

     all_headlines = []

     for url in news_list:

      try:
        response = requests.get(url, headers=headers , timeout=10)
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


        if header_tag:
            news_title = header_tag.text.strip()
            all_headlines.append({"url" : url, "title": news_title})

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


     return all_headlines



if __name__ == "__main__":
    scrape_food_news()