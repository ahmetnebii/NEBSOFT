# Kılavuz denetimi: PDF sayfalarını dörtlü görsellere çevirir, her sayfa gözle okunur. Yalnız geliştirme aracıdır.
# Kurulum (bir kez, depo dışına): python -m pip install --target <klasör> pypdfium2 pillow
# Kullanım: python scripts/kilavuz/sayfalar.py <klasör> indir/kilavuz/pos.pdf <çıktı öneki>
import sys
sys.path.insert(0, sys.argv[1])
import pypdfium2 as P
from PIL import Image
pdf = P.PdfDocument(sys.argv[2]); cikti = sys.argv[3]; adet = 4
print(len(pdf), 'sayfa')
G = [pdf[i].render(scale=1.0).to_pil().convert('RGB') for i in range(len(pdf))]
w, h = G[0].size
for s in range(0, len(G), adet):
    c = Image.new('RGB', (w * adet + 6 * (adet - 1), h), '#888')
    for j, im in enumerate(G[s:s + adet]): c.paste(im, (j * (w + 6), 0))
    c.save(f'{cikti}-{s + 1:03d}.jpg', quality=80)
