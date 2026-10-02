# Product image catalog

Every child directory represents one actual product and must contain:

```text
product-name/
├── product.json
├── PROMPTS.md
├── 01-front.png
├── 02-left-angle.png
├── 03-right-angle.png
└── 04-back-detail.png
```

The catalog includes 20 distinct product directories. Each `product.json`
contains exact product information, and each `PROMPTS.md` contains four
ready-to-copy prompts for that specific product. Start with
[`wireless-headphones`](./wireless-headphones/), then continue through the other
directories.

To add another product, copy the complete `wireless-headphones` directory,
rename it with a URL-friendly name, update `product.json`, replace the prompts,
and generate its four images. Do not place images directly in this root folder.

The seeder creates one record for each directory in every store. It reads the
returned seller ID for each store and the returned store ID for each product.
