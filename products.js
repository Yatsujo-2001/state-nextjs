/**
 * Benua 商品データ
 *
 * 商品を追加・削除・編集するときはこのファイルだけ変更してください。
 * index.html は自動で読み込んでグリッドを生成します。
 *
 * 各フィールドの説明:
 *   name     : 商品名（英語）
 *   price    : 価格（数字のみ / 円記号・カンマ不要）
 *   image    : 画像パス（images/ フォルダに置いてください）
 *   zozo_url : ZOZOの該当商品ページURL（コピーしてそのまま貼り付け）
 *   category : カテゴリ（tops / bottoms / accessories / styling）
 *   sold_out : 売り切れの場合は true にする（省略可）
 */
const PRODUCTS = [
  {
    name: "Cropped Vest",
    price: 12900,
    image: "images/item01.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "tops"
  },
  {
    name: "Pinstripe Vest",
    price: 14900,
    image: "images/item02.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "tops"
  },
  {
    name: "Wide Easy Pants",
    price: 16900,
    image: "images/item03.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "bottoms"
  },
  {
    name: "Check Wide Pants",
    price: 18900,
    image: "images/item04.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "bottoms"
  },
  {
    name: "Baseball Shirt",
    price: 13900,
    image: "images/item05.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "tops"
  },
  {
    name: "Logo Cap",
    price: 8900,
    image: "images/item06.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "accessories"
  },
  {
    name: "Sunflower Styling",
    price: 17900,
    image: "images/item07.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "styling"
  },
  {
    name: "Striped Open Collar Shirt",
    price: 11900,
    image: "images/item08.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "tops"
  },
  {
    name: "Brown Crop Tank",
    price: 9900,
    image: "images/item09.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "tops"
  },
  {
    name: "Leopard Scarf",
    price: 9900,
    image: "images/item10.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "accessories"
  },
  {
    name: "White Crop Tank",
    price: 8900,
    image: "images/item11.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "tops"
  },
  {
    name: "Picnic Styling",
    price: 15900,
    image: "images/item12.jpg",
    zozo_url: "https://zozo.jp/brand/benua/",
    category: "styling"
  }
];
