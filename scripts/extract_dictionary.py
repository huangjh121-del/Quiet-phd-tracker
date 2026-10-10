import os
import sqlite3
import json
from mdict_utils.base.readmdict import MDX

def create_db(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dict_oald (
            word TEXT PRIMARY KEY,
            definition_html TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dict_collocation (
            word TEXT PRIMARY KEY,
            definition_html TEXT
        )
    ''')
    conn.commit()
    return conn

def extract_mdx_to_table(conn, mdx_path, table_name):
    if not os.path.exists(mdx_path):
        print(f"File not found: {mdx_path}")
        return
        
    print(f"Reading {mdx_path} ... (This may take a minute)")
    mdx = MDX(mdx_path)
    
    cursor = conn.cursor()
    count = 0
    print(f"Inserting into {table_name}...")
    
    # mdx.items() returns (key, value) pairs
    # key is byte string, value is byte string
    for key, value in mdx.items():
        try:
            word = key.decode('utf-8').strip()
            html = value.decode('utf-8')
            
            # Use REPLACE to overwrite if exact duplicates exist
            cursor.execute(f"INSERT OR REPLACE INTO {table_name} (word, definition_html) VALUES (?, ?)", (word, html))
            count += 1
            
            if count % 10000 == 0:
                print(f"Processed {count} words...")
        except Exception as e:
            continue
            
    conn.commit()
    print(f"Successfully extracted {count} words into {table_name}!")

if __name__ == "__main__":
    import glob
    home_dir = os.path.expanduser('~')
    
    oald_dir = os.path.join(home_dir, "Desktop", "牛津高阶双解10")
    colloc_dir = os.path.join(home_dir, "Desktop", "牛津英语搭配词典双解")
    
    db_path = os.path.join(os.path.dirname(__file__), "..", "quiet_dictionary.sqlite")
    
    conn = create_db(db_path)
    
    print("=== Extracting OALD10 ===")
    oald_files = glob.glob(os.path.join(oald_dir, "*.mdx"))
    if oald_files:
        extract_mdx_to_table(conn, oald_files[0], "dict_oald")
    else:
        print("No .mdx file found in OALD10 directory.")
    
    print("\\n=== Extracting Collocations ===")
    colloc_files = glob.glob(os.path.join(colloc_dir, "*.mdx"))
    if colloc_files:
        extract_mdx_to_table(conn, colloc_files[0], "dict_collocation")
    else:
        print("No .mdx file found in Collocations directory.")
    
    conn.close()
    print(f"\\nAll done! Database saved to: {os.path.abspath(db_path)}")

