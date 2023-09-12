import requests
import zipfile
import io
from pathlib import Path
import shutil
from shutil import copytree

TMP_PATH = "/tmp/jacobsjo/createVanillaZips/"

REQUIRED_TYPES = [
    "worldgen/density_function",
    "worldgen/noise",
    "worldgen/noise_settings"
]

REQUIRED_PATHS = []

for path in REQUIRED_TYPES:
    REQUIRED_PATHS.append("data/minecraft/" + path)


def main(version: str, suffix: str = ""):
    # empty temp folder
    print("Emptying temp folder")
    emptyTmp()

    # get client jar
    print("Getting client jar")
    manifest = requests.get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json').json()
    version_entry = next((e for e in manifest['versions'] if e['id'] == version))
    version_json = requests.get(version_entry['url']).json()
    client_link = version_json['downloads']['client']['url']

    # extract required parts of client jar
    print("Extracting client jar")
    with zipfile.ZipFile(io.BytesIO(requests.get(client_link).content)) as jar:
        for file in jar.namelist():
            for path in REQUIRED_PATHS:
                if (file.startswith(path)):
                    jar.extract(file, TMP_PATH)

    # add datapack base
    print("Copying base files")
    copytree("vanilla_datapack_base/", TMP_PATH, dirs_exist_ok=True)

    # zip back up
    print("Creating fip files")

    shutil.make_archive("public/vanilla_datapacks/vanilla_datapack" + suffix, 'zip', TMP_PATH)

    print("Done!")

def emptyTmp():
    tmppath = Path(TMP_PATH)
    if (tmppath.exists() and tmppath.is_dir()):
        shutil.rmtree(tmppath)


if __name__ == "__main__":
    main('1.19.4', "_1_19")
