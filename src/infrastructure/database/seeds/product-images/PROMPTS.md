# Product image catalog

The root image, `shared-product.png`, is a neutral product placeholder. The
seeder uses this single local image for all 20 product definitions by default.
For safe independent deletion, it uploads a separate Cloudinary copy for each
product record.

Each child directory contains its own `product.json` and one optional product
image prompt:

```text
product-images/
├── shared-product.png
└── wireless-headphones/
    ├── product.json
    └── PROMPTS.md
```

You do not need to generate anything to use the shared image. If you later want
a matching image for one product, generate one from that folder's prompt and
save it in the folder as `product.png`. That product will use its own image;
the other products continue using the shared placeholder.
