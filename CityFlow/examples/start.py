import sys
sys.path.insert(0, '/mnt/c/Users/josem/CityFlow')
import cityflow
eng = cityflow.Engine("config.json")
eng.set_save_replay(True)