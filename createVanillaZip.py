from io import BytesIO
from urllib.request import urlopen
import json
from zipfile import ZipFile, ZIP_DEFLATED
from pathlib import Path
import shutil
import subprocess
import os


def extractJar(version: str, version_manifest):
   if (version in ['release','snapshot']):
      version_name = version_manifest['latest'][version]
   else:
      version_name = version
   print("Extracting Minecraft Jar Version " + version_name)
   version_url = next(
       filter(lambda v: v['id'] == version_name, version_manifest['versions']))['url']
   with urlopen(version_url) as version_data:
      version_json = json.loads(version_data.read().decode())
      jar_url = version_json['downloads']['client']['url']
      with urlopen(jar_url) as jar_data:
         with ZipFile(BytesIO(jar_data.read())) as jar_archive:
            for file in jar_archive.namelist():
               if file.startswith('data/minecraft/worldgen/noise_settings') \
                       or file.startswith('data/minecraft/worldgen/density_function') \
                       or file.startswith('data/minecraft/worldgen/noise'):
                  jar_archive.extract(file, "/tmp/minecraft/" + version + "/")

def zipdir(path, root_len_delta, ziph):
   pl = len(path) - root_len_delta
   # ziph is zipfile handle
   for root, dirs, files in os.walk(path):
      for file in files:
         ziph.write(os.path.join(root, file), os.path.join(root, file)[pl:])

def createZips(version, zip_version):
   zf = ZipFile("./public/vanilla_datapacks/vanilla_datapack_" + zip_version + ".zip", 'w', ZIP_DEFLATED)
   zipdir("/tmp/minecraft/" + version, 0, zf)
   zipdir("vanilla_datapack_base", 0, zf)
   zf.close()


dirpath = Path('/tmp/minecraft/')
if dirpath.exists() and dirpath.is_dir():
    shutil.rmtree(dirpath)

with urlopen('https://launchermeta.mojang.com/mc/game/version_manifest.json') as version_manifest_data:
   version_manifest = json.loads(version_manifest_data.read().decode())

   extractJar("snapshot", version_manifest)

   createZips("snapshot", "1_19")