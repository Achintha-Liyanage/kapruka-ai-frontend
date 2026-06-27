import React from 'react';

interface CategoryBubble {
  id: string;
  name: string;
  query: string;
  image: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

const CATEGORY_ITEMS = [
  ['automobile', 'Automobile', 'Show me automobile products'],
  ['ayurvedic', 'Ayurvedic', 'Show me ayurvedic products'],
  ['bicycle', 'Bicycle', 'Show me bicycles'],
  ['books', 'Books', 'Show me books'],
  ['chocolates', 'Chocolates', 'Show me chocolates'],
  ['clothing', 'Clothing', 'Show me clothing'],
  ['combopack', 'Combo Pack', 'Show me combo packs'],
  ['cosmetics', 'Cosmetics', 'Show me cosmetics'],
  ['curd', 'Curd', 'Show me curd'],
  ['electronic', 'Electronics', 'Show me electronics'],
  ['fashion', 'Fashion', 'Show me fashion products'],
  ['fruits', 'Fruits', 'Show me fruit baskets'],
  ['giftcert', 'Gift Vouchers', 'Show me gift certificates'],
  ['giftset', 'Gift Sets', 'Show me gift sets'],
  ['greetingcards', 'Greeting Cards', 'Show me greeting cards'],
  ['grocery', 'Grocery', 'Show me grocery items'],
  ['household', 'Household', 'Show me household products'],
  ['jewellery', 'Jewellery', 'Show me jewellery'],
  ['kidstoys', 'Kids Toys', 'Show me kids toys'],
  ['liquor', 'Liquor', 'Show me liquor'],
  ['babyitems', 'Baby Items', 'Show me baby items'],
  ['party', 'Party', 'Show me party items'],
  ['perfumes', 'Perfumes', 'Show me perfumes'],
  ['pet', 'Pet', 'Show me pet products'],
  ['pharmacy', 'Pharmacy', 'Show me pharmacy products'],
  ['pirikara', 'Pirikara', 'Show me pirikara'],
  ['childrens', 'Childrens', 'Show me childrens products'],
  ['schoolpride', 'School Pride', 'Show me school pride products'],
  ['softtoy', 'Soft Toys', 'Show me soft toys'],
  ['sports', 'Sports', 'Show me sports products'],
  ['vegetables', 'Vegetables', 'Show me vegetables'],
  ['adult-products', 'Adult Products', 'Show me adult products'],
  ['thaipongle', 'Thai Pongal', 'Show me Thai Pongal gifts'],
  ['teachersday', 'Teachers Day', 'Show me Teachers Day gifts'],
  ['samedaydelivery', 'Same Day Delivery', 'Show me same day delivery products'],
  ['bestsellers', 'Best Sellers', 'Show me best sellers'],
  ['diwali', 'Diwali', 'Show me Diwali gifts'],
  ['newadditions', 'New Additions', 'Show me new additions'],
  ['graduation', 'Graduation', 'Show me graduation gifts'],
  ['valentine', 'Valentine', 'Show me Valentine gifts'],
  ['newyear-january', 'New Year', 'Show me New Year gifts'],
  ['fathersday', 'Fathers Day', 'Show me Fathers Day gifts'],
  ['childrensday', 'Childrens Day', 'Show me Childrens Day gifts'],
  ['christmas', 'Christmas', 'Show me Christmas gifts'],
  ['anniversary', 'Anniversary', 'Show me anniversary gifts'],
  ['birthday', 'Birthday', 'Show me birthday gifts'],
  ['bridetobe', 'Bride To Be', 'Show me bride to be gifts'],
  ['corporate', 'Corporate', 'Show me corporate gifts'],
  ['lover', 'Lover', 'Show me romantic gifts'],
  ['momtobe', 'Mom To Be', 'Show me mom to be gifts'],
  ['mother', 'Mother', 'Show me gifts for mother'],
  ['sympathies', 'Sympathies', 'Show me sympathy flowers and gifts'],
  ['uniquegifts', 'Unique Gifts', 'Show me unique gifts'],
  ['wedding', 'Wedding', 'Show me wedding gifts'],
  ['womenday', 'Women Day', "Show me Women's Day gifts"],
  ['youandme', 'You And Me', 'Show me you and me gifts'],
  ['household-2', 'Household Essentials', 'Show me household essentials'],
  ['ornaments', 'Ornaments', 'Show me ornaments'],
  ['promotions', 'Promotions', 'Show me promotions'],
  ['cakes', 'Cakes', 'Show me cakes'],
  ['flowers', 'Flowers', 'Show me flowers'],
  ['personalized-gifts', 'Personalized Gifts', 'Show me personalized gifts'],
  ['halloween', 'Halloween', 'Show me Halloween gifts'],
  ['services', 'Services', 'Show me services'],
  ['food', 'Food', 'Show me food'],
] as const;

const LANES = ['34%', '78%', '48%', '86%', '40%', '68%', '82%', '56%'];
const SIZES = [104, 124, 140, 112, 132, 108, 148, 120];
const BUBBLE_CYCLE_SECONDS = 285;

const CATEGORY_BUBBLES: CategoryBubble[] = CATEGORY_ITEMS.map(([id, name, query], index) => ({
  id,
  name,
  query,
  image: `/category-bubbles/${id}.png`,
  left: LANES[index % LANES.length],
  size: SIZES[index % SIZES.length],
  duration: BUBBLE_CYCLE_SECONDS,
  delay: -(index * BUBBLE_CYCLE_SECONDS) / CATEGORY_ITEMS.length,
  drift: (index % 2 === 0 ? 1 : -1) * (22 + (index % 4) * 6),
}));

interface CategoryTickerProps {
  onCategorySelect: (query: string) => void;
}

export const CategoryTicker: React.FC<CategoryTickerProps> = ({ onCategorySelect }) => {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="category-nebula absolute inset-0" />
      <div className="category-trail absolute left-[50%] top-[0%] h-full w-48 -translate-x-1/2 rotate-[20deg]" />

      {CATEGORY_BUBBLES.map((category) => (
        <button
          key={category.id}
          type="button"
          aria-label={category.name}
          onClick={() => onCategorySelect(category.query)}
          style={
            {
              left: category.left,
              width: category.size,
              height: category.size,
              animationName: 'categoryBubbleSnake',
              animationDuration: `${category.duration}s`,
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
              animationDelay: `${category.delay}s`,
              '--bubble-drift': `${category.drift}px`,
            } as React.CSSProperties
          }
          className="category-bubble focus-ring absolute bottom-[-10rem] -translate-x-1/2 rounded-full"
        >
          <span className="category-bubble-orb">
            <img src={category.image} alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </span>
          <span className="category-bubble-label pointer-events-none absolute left-1/2 top-[76%] z-10 max-w-[92%] -translate-x-1/2 rounded-full border border-white/25 bg-[#040617]/90 px-2.5 py-1 text-center text-[9px] font-black uppercase leading-none tracking-[0.025em] text-white shadow-[0_0_18px_rgba(0,0,0,0.86)] backdrop-blur-md [text-shadow:0_1px_4px_rgba(0,0,0,1)]">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTicker;
