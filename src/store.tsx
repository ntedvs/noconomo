import { useTitle } from "./use-title"

type Item = { name: string; url: string; image: string }

const ITEMS: Item[] = [
  {
    name: "Mug",
    url: "https://www.zazzle.com/mug-168421287719410707",
    image:
      "https://rlv.zcache.com/mug-r87ca0b6b68dd4b62889de22446d30246_x7jg9_8byvr_512.webp",
  },
  {
    name: "Pint Glass",
    url: "https://www.zazzle.com/pint_glass-256700030374582328",
    image:
      "https://rlv.zcache.com/pint_glass-r936db85f33464e479b8301f0b04add90_b1a5y_512.webp",
  },
  {
    name: "Acrylic Tumbler",
    url: "https://www.zazzle.com/acrylic_tumbler-256923371819097646",
    image:
      "https://rlv.zcache.com/acrylic_tumbler-r15f91c3ddf4342a7b8b378e3d9ef30aa_b5qe9_512.webp",
  },
  {
    name: "Tote Bag",
    url: "https://www.zazzle.com/tote_bag-149369603446549773",
    image:
      "https://rlv.zcache.com/tote_bag-r608fbab4f46c4bcdad9236cde5a8eae2_texyj_8byvr_512.webp",
  },
  {
    name: "T-Shirt",
    url: "https://www.zazzle.com/t_shirt-235714041502017166",
    image:
      "https://rlv.zcache.com/t_shirt-ra5a6a00dea534254a18e18b778a161e1_k2gr0_512.webp",
  },
  {
    name: "Men's Hooded Sweatshirt",
    url: "https://www.zazzle.com/ash_hooded_sweatshirt-235823011230148492",
    image:
      "https://rlv.zcache.com/ash_hooded_sweatshirt-r059b1d4074b042e5bf4f03cb03ac164c_jg9fv_512.webp",
  },
  {
    name: "Women's Hooded Sweatshirt",
    url: "https://www.zazzle.com/womans_ash_hoodie-235304188062264484",
    image:
      "https://rlv.zcache.com/womans_ash_hoodie-r7be24c2a13e645dfa04972de5f27efbf_j1hfz_512.webp",
  },
  {
    name: "Kids T-Shirt",
    url: "https://www.zazzle.com/kids_t_shirt-235185254734442175",
    image:
      "https://rlv.zcache.com/kids_t_shirt-rbf3b055ce9bc4448aa03f29acf058e94_65ldk_512.webp",
  },
  {
    name: "Kids Hoodie",
    url: "https://www.zazzle.com/kids_hoodie-235528965984002537",
    image:
      "https://rlv.zcache.com/kids_hoodie-rcfd6cbdb1bcc46a5874719c017b4fd78_65prm_512.webp",
  },
  {
    name: "Onesie Baby Bodysuit",
    url: "https://www.zazzle.com/onsie_baby_bodysuit-235891692203565503",
    image:
      "https://rlv.zcache.com/onsie_baby_bodysuit-r5d79ef21262f419bbdbfeed3d4909427_j2nhc_512.webp",
  },
  {
    name: "Genuine Bicycle Playing Cards",
    url: "https://www.zazzle.com/genuine_bicycle_playing_cards-256023075844683601",
    image:
      "https://rlv.zcache.com/genuine_bicycle_playing_cards-re913f2c4c5ee4c24ac16e504afb16565_fsvzl_8byvr_512.webp",
  },
  {
    name: "Folded Greeting Card",
    url: "https://www.zazzle.com/folded_greeting_card-256458227135663012",
    image:
      "https://rlv.zcache.com/folded_greeting_card-r262445cc14f1467da26f50eda310dd04_tcvtb_512.webp",
  },
  {
    name: "Double Sided Acrylic Keychain",
    url: "https://www.zazzle.com/double_sided_acrylic_keychain-256224651962010225",
    image:
      "https://rlv.zcache.com/double_sided_acrylic_keychain-rf5aec8e46956451387af52ad720000b2_fupuo_8byvr_512.webp",
  },
  {
    name: "Simple Logo Stickers",
    url: "https://www.zazzle.com/simple_logo_stickers-217345446554336464",
    image:
      "https://rlv.zcache.com/simple_logo_stickers-r03a5d17cbd7543549546e15ce4f75b1a_0ugmp_8byvr_512.webp",
  },
  {
    name: "Wilson Ultra 500 Distance Golf Ball",
    url: "https://www.zazzle.com/custom_wilson_ultra_500_distance_golf_ball-256138691347136807",
    image:
      "https://rlv.zcache.com/custom_wilson_ultra_500_distance_golf_ball-r92e4718f110849efb73e5ca274cea1d4_efkk9_512.webp",
  },
]

export default function Store() {
  useTitle("Store")
  return (
    <div className="mx-auto max-w-5xl p-4">
      <h2 className="mb-4 text-2xl font-semibold">Store</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {ITEMS.map((item) => (
          <a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="flex flex-col gap-2 rounded border p-3 hover:shadow-sm"
          >
            <img
              src={item.image}
              alt={item.name}
              className="aspect-square rounded bg-white object-contain"
              loading="lazy"
            />
            <div className="text-sm font-medium">{item.name}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
