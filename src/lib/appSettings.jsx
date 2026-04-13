import { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  my: {
    "Search stories...": "ဇာတ်လမ်းများကို ရှာဖွေပါ...",
    "Search stories, webtoons...": "ဇာတ်လမ်းများ၊ ဝက်ဘ်တွန်းများကို ရှာဖွေပါ...",
    Publish: "တင်မည်",
    "Sign Up": "အကောင့်ဖွင့်ရန်",
    "Creator Hub": "ဖန်တီးသူ Hub",
    Home: "ပင်မ",
    Library: "စာကြည့်တိုက်",
    Store: "စတိုး",
    Profile: "ပရိုဖိုင်",
    "Trending Now": "လက်ရှိလူကြိုက်များ",
    "New Releases": "အသစ်တင်ထားသော အကြောင်းအရာများ",
    Advertisement: "ကြော်ငြာ",
    Promotion: "ပရိုမိုးရှင်း",
    Studios: "စတူဒီယိုများ",
    "Individual Creators": "တစ်ဦးချင်း ဖန်တီးသူများ",
    "Recommended For You": "သင့်အတွက် အကြံပြုချက်များ",
    All: "အားလုံး",
    Webtoon: "ဝက်ဘ်တွန်း",
    Novel: "နိုဝယ်",
    Comics: "ကာတွန်းစာအုပ်",
    Knowledge: "ဗဟုသုတ",
    Other: "အခြား",
    "Filtered Series": "စစ်ထုတ်ထားသော စီးရီးများ",
    "Top 10 Popularity Ranking": "လူကြိုက်များမှု ထိပ်တန်း ၁၀",
    "Fall in Romance": "အချစ်ဇာတ်လမ်းများ",
    "Get into Action": "အက်ရှင်ဇာတ်လမ်းများ",
    "Mystery Tales": "လျှို့ဝှက်ဆန်းကြယ် ဇာတ်လမ်းများ",
    "Fantasy Realms": "စိတ်ကူးယဉ် ကမ္ဘာများ",
    "Horror Zone": "ကြောက်မက်ဖွယ် ဇုန်",
    "Comedy Corner": "ဟာသကဏ္ဍ",
    "Reading History": "ဖတ်ရှုပြီးမှတ်တမ်း",
    Favorites: "အကြိုက်ဆုံးများ",
    Bookmarks: "မှတ်သားထားမှုများ",
    "You May Also Like": "သင်ကြိုက်နှစ်သက်နိုင်သည်များ",
    "Creator Mode": "ဖန်တီးသူ မုဒ်",
    "Upload Content": "အကြောင်းအရာတင်ရန်",
    Analytics: "အချက်အလက်ခွဲခြမ်း",
    Notifications: "အသိပေးချက်များ",
    "Edit creator profile": "ဖန်တီးသူ ပရိုဖိုင် ပြင်ရန်",
    "Active Creator Profile": "အသုံးပြုနေသော ဖန်တီးသူ ပရိုဖိုင်",
    "Primary format": "အဓိက အမျိုးအစား",
    Verification: "အတည်ပြုမှု",
    "Creator snapshot": "ဖန်တီးသူ အခြေအနေ",
    "Total Views": "စုစုပေါင်း ကြည့်ရှုမှု",
    "Total Likes": "စုစုပေါင်း နှစ်သက်မှု",
    Followers: "နောက်လိုက်များ",
    "Total Earnings": "စုစုပေါင်း ဝင်ငွေ",
    "Recent earnings": "မကြာသေးမီ ဝင်ငွေ",
    "Published works": "ထုတ်ဝေပြီး အလုပ်များ",
    "Drafts & schedule": "မူကြမ်းများနှင့် အချိန်ဇယား",
    Messages: "မက်ဆေ့များ",
    Eggs: "ဥများ",
    Status: "အခြေအနေ",
    "Community Badge": "အသိုင်းအဝိုင်း တံဆိပ်",
    "Support Level": "ပံ့ပိုးမှု အဆင့်",
    "Switch Mode": "မုဒ်ပြောင်းရန်",
    "Edit Profile": "ပရိုဖိုင် ပြင်ရန်",
    "Purchase History": "ဝယ်ယူမှု မှတ်တမ်း",
    Settings: "ဆက်တင်များ",
    Logout: "ထွက်ရန်",
    Back: "နောက်သို့",
    Explore: "လေ့လာရန်",
    "Read Now": "ယခုဖတ်ရန်",
    "More Like This": "ဤကဲ့သို့ ထပ်မံကြည့်ရန်",
    Synopsis: "အကျဉ်းချုပ်",
    Episodes: "အပိုင်းများ",
    Free: "အခမဲ့",
    Premium: "ပရီမီယံ",
    Follow: "လိုက်ရန်",
    Following: "လိုက်နေသည်",
    "Follow Creator": "ဖန်တီးသူကို လိုက်ရန်",
    "Create Account": "အကောင့်ဖန်တီးရန်",
    "Become Creator": "ဖန်တီးသူ ဖြစ်လာရန်",
    "Start Reading": "စတင်ဖတ်ရန်",
    "Show More Episodes": "အပိုင်းများ ပိုမိုပြရန်",
    "Show Fewer Episodes": "အပိုင်းများ နည်းပြရန်",
    Paper: "စာရွက်",
    Sepia: "အညိုဖျော့",
    Night: "ညမုဒ်",
    "Reader Tools": "ဖတ်ရှုခြင်း ကိရိယာများ",
    "Text Size": "စာအရွယ်အစား",
    "Reading Theme": "ဖတ်ရှုမည့် အရောင်ပုံစံ",
    "Jump to episode": "အပိုင်းသို့ သွားရန်",
    "Like Episode": "အပိုင်းကို နှစ်သက်သည်",
    "Liked Episode": "အပိုင်းကို နှစ်သက်ပြီး",
    Comments: "မှတ်ချက်များ",
    "Add Comment": "မှတ်ချက် ထည့်ရန်",
    "Post Comment": "မှတ်ချက် တင်ရန်",
    "Save Changes": "ပြောင်းလဲမှုများ သိမ်းရန်",
    "Cancel Edit": "ပြင်ဆင်မှု မလုပ်တော့ပါ",
    "Write a comment first.": "မှတ်ချက်ကို အရင်ရေးပါ။",
    "Editing your comment.": "သင့်မှတ်ချက်ကို ပြင်ဆင်နေသည်။",
    "No comments yet. Be the first to add one.": "မှတ်ချက် မရှိသေးပါ။ ပထမဆုံးရေးပါ။",
    "Open account": "အကောင့် ဖွင့်ရန်",
    "Create or open a local reader account to add comments on episodes and chapters. ": "အပိုင်းများနှင့် ခန်းများတွင် မှတ်ချက်ထည့်ရန် ဒေသတွင်း reader အကောင့်တစ်ခု ဖန်တီးပါ သို့မဟုတ် ဖွင့်ပါ။ ",
    "Checkout summary": "ဝယ်ယူမှု အကျဉ်းချုပ်",
    "Choose payment provider": "ငွေပေးချေရန် ဝန်ဆောင်မှုကို ရွေးချယ်ပါ",
    "Fill information": "အချက်အလက် ဖြည့်ပါ",
    "Complete Purchase": "ဝယ်ယူမှု အပြီးသတ်ပါ",
    "Continue Payment": "ငွေပေးချေမှု ဆက်လုပ်ရန်",
    Cancel: "မလုပ်တော့ပါ",
    "All transactions are secure and encrypted.": "ငွေပေးချေမှုအားလုံးကို လုံခြုံစွာ ကာကွယ်ထားပါသည်။",
    "Top up your eggs": "ဥများ ထပ်ဖြည့်ပါ"
  }
};

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => window.localStorage.getItem("toouTheme") || "light");
  const [language, setLanguage] = useState(
    () => window.localStorage.getItem("toouLanguage") || "eng"
  );

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("toouTheme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language === "my" ? "my" : "en";
    window.localStorage.setItem("toouLanguage", language);
  }, [language]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      language,
      setLanguage,
      t(text) {
        if (language !== "my") return text;
        return translations.my[text] || text;
      }
    }),
    [language, theme]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }
  return context;
}
