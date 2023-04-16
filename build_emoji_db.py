import requests

emoji_sources = [
    'https://unicode.org/Public/emoji/15.0/emoji-sequences.txt',
    'https://unicode.org/Public/emoji/15.0/emoji-zwj-sequences.txt',
]

with open('scripts/emojis/list.ts', 'w') as fout:
    print("const emojis = [", end='\n', file=fout)
    for source in emoji_sources:
        response = requests.get(source)
        for line in response.content.decode('utf8').split('\n'):
            if line.strip() and not line.startswith('#'):
                hexa = line.split(';')[0]
                hexa = hexa.split('..')
                if len(hexa) == 1:
                    ch = ''.join([chr(int(h, 16)) for h in hexa[0].strip().split(' ')])
                    print(f"'{ch}',", end='\n', file=fout)
                else:
                    start, end = hexa
                    for ch in range(int(start, 16), int(end, 16)+1):
                        #ch = ''.join([chr(int(h, 16)) for h in ch.split(' ')])
                        print(f"'{chr(ch)}',", end='\n', file=fout)
    print("];", end='\n', file=fout)
    print("export default emojis;", end='\n', file=fout)
