from bs4 import BeautifulSoup
import requests


def scrape_food_news():
     news_to_scrape = requests.get("https://www.malaymail.com/news/malaysia/2026/03/13/no-need-to-worry-malaysias-food-supply-stable-for-raya-says-mat-sabu/212502")
     inspect = BeautifulSoup(news_to_scrape.text, "html.parser")
     news = inspect.find_all("div", attrs={"class": "col-md-12 pad-top-0"})
     header = news[0].find("h1").text


     print(header)


if __name__ == "__main__":
    scrape_food_news()