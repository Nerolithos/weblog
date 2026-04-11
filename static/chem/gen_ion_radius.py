import pandas as pd

URL = "https://en.wikipedia.org/wiki/Ionic_radius"


def main():
    print("Fetching tables from", URL)
    tables = pd.read_html(URL)
    print(f"Total tables: {len(tables)}")
    for i, t in enumerate(tables):
        print("\n=== Table index", i, "===")
        print("Columns:", list(t.columns))
        print(t.head(3))


if __name__ == "__main__":
    main()
