#python3 add_elements.py roadnet_3_4.json cebras road_0_1_0 road_2_1_2 stops road_1_1_1 notStops road_2_2_2 cedas road_1_1_1 road_3_3_3 
import json
import sys

def update_json(json_file, classes):
    allowed_classes = ["cebras", "stops","notStops","cedas"]
    with open(json_file, 'r') as f:
        data = json.load(f)

    current_class = None
    for item in classes:
        if item in allowed_classes:
            current_class = item
            if current_class not in data:
                data[current_class] = []
        elif current_class is not None:
            class_count = len(data[current_class]) + 1
            #id_name = f"{current_class}_{class_count}"
            data[current_class].append({"road": item, "id": f"{current_class[:-1]}_{class_count}"})
        else:
            print("Error: IDs must be preceded by a class name.")

    with open(json_file, 'w') as f:
        json.dump(data, f, indent=2)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python script.py <json_file> <class1 ids1> [<class2 ids2> ...]")
        sys.exit(1)

    json_file = sys.argv[1]
    classes = sys.argv[2:]
    update_json(json_file, classes)
    print("JSON file updated successfully.")
