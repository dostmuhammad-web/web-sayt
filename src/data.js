export const categories = [
  "Fiction","Science","History","Programming","Business","Education",
  "Biography","Fantasy","Mystery","Romance","Children","Self Development"
];

const titleParts = {
  Fiction: ["Tun","Soyalar","Oxirgi","Yolg'iz","Shamol","Qalb","Yulduzlar","Yo'l","Xotira","Sukunat","Taqdir","Orzu"],
  Science: ["Kvant","Koinot","Genom","Atom","Evolyutsiya","Neyron","Kosmos","Materiya","Zarracha","Kelajak","Tadqiqot","Formula"],
  History: ["Imperiya","Inqilob","Buyuk","Samarqand","Temur","Istiqlol","Jadid","Ipak Yo'li","Xiva","Buxoro","Urush","Tinchlik"],
  Programming: ["JavaScript","Python","React","Algoritm","Kod","System Design","Ma'lumot Tuzilmalari","Clean Code","AI","Backend","Frontend","DevOps"],
  Business: ["Startup","Moliya","Marketing","Liderlik","Brend","Pul","Investitsiya","Strategiya","Muzokara","Sotuv","Boshqaruv","Boylik"],
  Education: ["Matematika","Fizika","Kimyo","Tarix","Geografiya","Biologiya","Ingliz Tili","Mantiq","Imtihon","O'qituvchi","Dars","Bilim"],
  Biography: ["Hayot","Xotiralar","Yo'l","Muvaffaqiyat","Kurash","Orzu","Qaytish","Qismat","Jasorat","Ilhom","Shaxs","Taqdir"],
  Fantasy: ["Ajdar","Sehr","Qasr","Jodugar","Qilich","Ruh","Xazina","Qorong'u","Nur","Afsona","Yalmog'iz","Qahramon"],
  Mystery: ["Sir","Jinoyat","Iz","Detective","Taqib","G'oyib","Qotil","Ish","Parole","Maxfiy","Guvoh","Jumboq"],
  Romance: ["Muhabbat","Yurak","Baxt","Uchrashuv","Xat","Bahor","Sevgi","Sog'inch","Orzu","Kutish","Va'da","Nasiba"],
  Children: ["Quyon","Ayiq","Sirk","Sehrli","Do'stlar","Bog'","Jajji","Kamalak","O'yin","Ertak","Qushcha","Yulduzcha"],
  "Self Development": ["Odat","Fokus","Iroda","Reja","Maqsad","O'zgarish","Sabr","Energiya","Vaqt","Qaror","Ishonch","Rivoj"]
};

const nouns = ["Daftari","Tarixi","Sirlari","Yo'li","Kuchi","San'ati","Afsonasi","Dunyosi","Hayoti","Qissasi","Izidan","Nuri"];

const authorsPool = [
  "O'tkir Hoshimov","Abdulla Qodiriy","Tohir Malik","Cho'lpon","Erkin Vohidov","Muhammad Yusuf",
  "James Clear","Robert Kiyosaki","Yuval Noah Harari","George Orwell","J.K. Rowling","Agatha Christie",
  "Paulo Coelho","Stephen King","Jane Austen","Leo Tolstoy","Fyodor Dostoevsky","Mark Manson",
  "Cal Newport","Daniel Kahneman","Michelle Obama","Walter Isaacson","Elon Musk","Andrzej Sapkowski",
  "Brandon Sanderson","Colleen Hoover","John Green","Malcolm Gladwell","Brene Brown","Simon Sinek",
  "Naval Ravikant","Tim Ferriss","Dale Carnegie","Napoleon Hill","Brian Tracy","Robin Sharma",
  "Islom Karimov","Saadi Sherozi","Alisher Navoiy","Zahiriddin Bobur","Ibn Sino","Beruniy",
  "Antoine de Saint-Exupery","Harper Lee","J.R.R. Tolkien","Dan Brown","Jo Nesbo","Lucy Maud Montgomery",
  "Khaled Hosseini","Orhan Pamuk","Elif Shafak","Murakami Haruki","Gabriel Garcia Marquez","Isabel Allende",
  "Margaret Atwood","Neil Gaiman","Rick Riordan","Suzanne Collins","Victoria Aveyard","Sarah J. Maas",
  "Adam Grant","Angela Duckworth","Charles Duhigg","Deep Work Lab","Eric Ries","Peter Thiel",
  "Phil Knight","Tony Robbins","Seth Godin","Gary Vaynerchuk","Chris Voss","Jordan Peterson"
];

const languages = ["O'zbek","Rus","Ingliz"];
const descs = [
  "Ushbu kitob o'quvchini chuqur fikrlashga va hayotga boshqacha nazar bilan qarashga undaydi. Har bir bobida amaliy maslahatlar va ilhomlantiruvchi hikoyalar mavjud.",
  "Muallifning yillar davomida to'plagan tajribasi va kuzatuvlari asosida yozilgan ushbu asar har qanday yoshdagi kitobxon uchun foydali bo'ladi.",
  "Zamonaviy dunyoning eng dolzarb muammolariga javob izlagan holda, muallif sodda va tushunarli tilda murakkab g'oyalarni yoritib beradi.",
  "Kitob haqiqiy voqealarga asoslangan bo'lib, unda qahramonlarning taqdiri, orzu va kurashlari jonli tasvirlangan.",
  "Amaliy mashqlar, misollar va hayotiy keyslar bilan boyitilgan ushbu qo'llanma sizga yangi ko'nikmalarni tez o'zlashtirishga yordam beradi."
];

function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
const rng = mulberry32(20241015);
const pick = arr => arr[Math.floor(rng()*arr.length)];
const randInt = (a,b)=> Math.floor(rng()*(b-a+1))+a;

function makeBook(id){
  const category = categories[(id-1)%categories.length];
  const author = pick(authorsPool);
  const part1 = pick(titleParts[category]||titleParts.Fiction);
  const part2 = pick(nouns);
  const extra = rng()>0.6 ? ` ${pick(["va","uchun","haqida","sari"])} ${pick(titleParts[category])}` : "";
  const title = `${part1} ${part2}${extra}`.trim();
  const price = randInt(19000, 189000);
  const rating = Math.round((randInt(35,50)/10)*10)/10;
  const reviewsCount = randInt(3, 820);
  const pages = randInt(96, 720);
  const language = pick(languages);
  const year = randInt(1985, 2025);
  const stock = randInt(0,45);
  const description = pick(descs) + " " + pick(descs);
  const image = `https://picsum.photos/seed/book${id}${category}/300/430`;
  const reviewSamples = Array.from({length: randInt(1,4)},(_,k)=>({
    id: `${id}-${k+1}`,
    user: pick(["Aziz","Malika","Javohir","Sevara","Bobur","Dilnoza","Sardor","Laylo","Umid","Nargiza"]),
    rating: randInt(4,5),
    text: pick([
      "Juda yoqdi, tavsiya qilaman! Amaliy va tushunarli.",
      "Sifati zo'r, yetkazib berish tez bo'ldi. 10/10",
      "Mazmuni boy, lekin ayrim joylari murakkabroq ekan.",
      "Farzan farzandim bilan o'qidik, juda manfaatli bo'ldi.",
      "Narxiga arziydi, muqovasi ham chiroyli.",
      "Ko'p narsani o'rgandim, ikkinchi marta o'qimoqchiman."
    ]),
    date: `2025-${String(randInt(1,9)).padStart(2,'0')}-${String(randInt(10,28)).padStart(2,'0')}`
  }));
  return { id, title, author, image, price, category, rating, reviews: reviewsCount, reviewsList: reviewSamples, pages, language, year, description, stock };
}

export const books = Array.from({length: 1000}, (_,i)=> makeBook(i+1));

export function getAuthors(){
  const map = new Map();
  books.forEach(b=>{
    if(!map.has(b.author)) map.set(b.author,{ name:b.author, books:[], totalRating:0, count:0, categories:new Set()});
    const a=map.get(b.author);
    a.books.push(b);
    a.totalRating+=b.rating;
    a.count++;
    a.categories.add(b.category);
  });
  return Array.from(map.values()).map(a=>({
    name:a.name,
    books:a.books,
    count:a.count,
    avgRating: Math.round((a.totalRating/a.count)*10)/10,
    categories: Array.from(a.categories),
    image: `https://i.pravatar.cc/300?u=${encodeURIComponent(a.name)}`,
    bio: `${a.name} — ${a.count} ta kitob muallifi. Ilmiy va badiiy asarlari bilan tanilgan. Kitoblari ${a.categories.values().next().value} va boshqa yo'nalishlarda mashhur.`
  })).sort((a,b)=> b.count - a.count);
}
