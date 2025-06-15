import json

import xml.etree.ElementTree as ET
tree = ET.parse('src/isa/amdgpu_isa_mi300.xml')
root = tree.getroot()
isa = root.find('ISA')
instructions = isa.find('Instructions')
names = instructions.findall('./Instruction/InstructionName')
pattern: str = "|".join(name.text for name in names)

# Data to be written
data = {
  "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
  "scopeName": "source.amdgpu.instr",
  "patterns": [
    { "include": "#instructions" }
  ],
  "repository": {
    "instructions": {
      "patterns": [
        {
          "name": "keyword.control.instruction.amdgpu",
          "match": f"\\b({pattern.lower()})\\b"
        }
      ]
    }
  }
}

# Writing to sample.json
with open("syntaxes/amdgpu_isa_mi300.json", "w") as outfile:
    json.dump(data, outfile, indent=4)