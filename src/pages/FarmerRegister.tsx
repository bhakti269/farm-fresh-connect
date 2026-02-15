import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowRight, Upload, Sprout, CheckCircle2, Loader2, Camera, Video, FileText, Lightbulb, Search, Pencil, Plus, HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Category-specific specifications: wheat specs show ONLY when category is "wheat"; other categories get their own specs.
type SpecOption = { value: string; label: string };
type SpecGroup = { key: string; label: string; important?: boolean; type: "radio" | "checkbox"; options: SpecOption[] };
const SPECS_BY_CATEGORY: Record<string, SpecGroup[]> = {
  // Wheat only: full wheat-specific specs (Wheat Type, Grade, Usage, Purity, Moisture, Protein, etc.)
  wheat: [
    { key: "wheatType", label: "Wheat Type", important: true, type: "radio", options: [
      { value: "sharbati", label: "Sharbati" }, { value: "desi", label: "Desi Wheat" }, { value: "khapli", label: "Khapli" }, { value: "lokwan", label: "Lokwan" },
      { value: "milling", label: "Milling Wheat" }, { value: "red", label: "Red Wheat" }, { value: "mp", label: "MP Wheat" }, { value: "durum", label: "Durum" },
      { value: "soft", label: "Soft Wheat" }, { value: "other", label: "Other" },
    ]},
    { key: "grade", label: "Grade", important: true, type: "radio", options: [
      { value: "food-grade", label: "Food Grade" }, { value: "milling-grade", label: "Milling Grade" }, { value: "a-grade", label: "A Grade" },
      { value: "feed-grade", label: "Feed Grade" }, { value: "b-grade", label: "B Grade" }, { value: "other", label: "Other" },
    ]},
    { key: "usage", label: "Usage", important: true, type: "checkbox", options: [
      { value: "chakki-atta", label: "Chakki Atta" }, { value: "pasta", label: "Pasta" }, { value: "flour-mill", label: "Flour Mill" },
      { value: "feed", label: "Feed" }, { value: "bakery", label: "Bakery" }, { value: "household", label: "Household" }, { value: "other", label: "Other" },
    ]},
    { key: "cultivationType", label: "Cultivation Type", type: "radio", options: [
      { value: "inorganic", label: "Inorganic" }, { value: "organic", label: "Organic" }, { value: "natural", label: "Natural" }, { value: "other", label: "Other" },
    ]},
    { key: "purity", label: "Purity", type: "radio", options: [
      { value: "99", label: "99 %" }, { value: "98", label: "98 %" }, { value: "97", label: "97 %" }, { value: "96", label: "96 %" }, { value: "other", label: "Other" },
    ]},
    { key: "moisture", label: "Moisture", type: "radio", options: [
      { value: "10", label: "Max 10 %" }, { value: "11", label: "Max 11 %" }, { value: "12", label: "Max 12 %" },
      { value: "13", label: "Max 13 %" }, { value: "14", label: "Max 14 %" }, { value: "other", label: "Other" },
    ]},
    { key: "protein", label: "Protein", type: "radio", options: [
      { value: "10-11", label: "10 % - 11 %" }, { value: "11-12", label: "11 % - 12 %" }, { value: "12-13", label: "12 % - 13 %" }, { value: "13-14", label: "13 % - 14 %" },
    ]},
    { key: "foreignMatter", label: "Foreign Matter", type: "radio", options: [
      { value: "0.5", label: "Max 0.5 %" }, { value: "1", label: "Max 1 %" },
    ]},
    { key: "packagingType", label: "Packaging Type", type: "radio", options: [
      { value: "jute-bag", label: "Jute Bag" }, { value: "pp-bag", label: "PP Bag" }, { value: "hdpe-bag", label: "HDPE Bag" },
      { value: "bulk", label: "Bulk" }, { value: "retail-pack", label: "Retail Pack" },
    ]},
  ],
  // Rice (under Cereals): Variety, Processing Type, Packaging Size, Grain Length (AGL)
  rice: [
    { key: "variety", label: "Variety", important: true, type: "radio", options: [
      { value: "1121", label: "1121" }, { value: "traditional", label: "Traditional" }, { value: "1509", label: "1509" },
      { value: "1718", label: "1718" }, { value: "pusa", label: "Pusa" }, { value: "1401", label: "1401" }, { value: "other", label: "Other" },
    ]},
    { key: "processingType", label: "Processing Type", important: true, type: "radio", options: [
      { value: "steam", label: "Steam" }, { value: "raw", label: "Raw" }, { value: "golden-sella", label: "Golden Sella" },
      { value: "creamy-sella", label: "Creamy Sella" }, { value: "white-sella", label: "White Sella" }, { value: "other", label: "Other" },
    ]},
    { key: "packagingSizeRice", label: "Packaging Size", type: "radio", options: [
      { value: "25-kg", label: "25 kg" }, { value: "30-kg", label: "30 kg" }, { value: "26-kg", label: "26 kg" },
      { value: "10-kg", label: "10 kg" }, { value: "50-kg", label: "50 kg" }, { value: "5-kg", label: "5 kg" },
      { value: "1-kg", label: "1 kg" }, { value: "other", label: "Other" },
    ]},
    { key: "grainLengthAGL", label: "Grain Length (AGL)", type: "radio", options: [
      { value: "8.35", label: "8.35 mm" }, { value: "7.70", label: "7.70 mm" }, { value: "8.30", label: "8.30 mm" },
      { value: "8.40", label: "8.40 mm" }, { value: "7.85", label: "7.85 mm" }, { value: "7.90", label: "7.90 mm" },
      { value: "7.50", label: "7.50 mm" }, { value: "7.30", label: "7.30 mm" }, { value: "other", label: "Other" },
    ]},
  ],
  // Brown Basmati Rice: specific specs when this category is mapped
  brownBasmatiRice: [
    { key: "variety", label: "Variety", important: true, type: "radio", options: [
      { value: "basmati", label: "Basmati" }, { value: "pusa-basmati", label: "Pusa Basmati" }, { value: "1121-basmati", label: "1121 Basmati" },
      { value: "traditional-basmati", label: "Traditional Basmati" }, { value: "1509-basmati", label: "1509 Basmati" }, { value: "other", label: "Other" },
    ]},
    { key: "brokenPercentage", label: "Broken Percentage", important: true, type: "radio", options: [
      { value: "nil", label: "Nil Broken" }, { value: "up-to-2", label: "Up to 2%" }, { value: "up-to-5", label: "Up to 5%" },
      { value: "up-to-10", label: "Up to 10%" }, { value: "up-to-25", label: "Up to 25%" }, { value: "other", label: "Other" },
    ]},
    { key: "packagingSizeRice", label: "Packaging Size", important: true, type: "radio", options: [
      { value: "1-kg", label: "1 kg" }, { value: "5-kg", label: "5 kg" }, { value: "10-kg", label: "10 kg" },
      { value: "25-kg", label: "25 kg" }, { value: "50-kg", label: "50 kg" }, { value: "other", label: "Other" },
    ]},
    { key: "processingType", label: "Processing Type", type: "radio", options: [
      { value: "raw", label: "Raw" }, { value: "parboiled", label: "Parboiled" }, { value: "other", label: "Other" },
    ]},
    { key: "sortexQuality", label: "Sortex Quality", type: "radio", options: [
      { value: "100-sortex", label: "100% Sortex" }, { value: "sortex-clean", label: "Sortex Clean" }, { value: "other", label: "Other" },
    ]},
    { key: "packagingType", label: "Packaging Type", type: "radio", options: [
      { value: "pp-bag", label: "PP Bag" }, { value: "jute-bag", label: "Jute Bag" }, { value: "hdpe-bag", label: "HDPE Bag" },
      { value: "bopp-bag", label: "BOPP Bag" }, { value: "vacuum-pack", label: "Vacuum Pack" }, { value: "other", label: "Other" },
    ]},
    { key: "grainType", label: "Grain Type", type: "radio", options: [
      { value: "long-grain", label: "Long Grain" }, { value: "extra-long-grain", label: "Extra Long Grain" },
    ]},
    { key: "cuisine", label: "Cuisine", type: "checkbox", options: [
      { value: "indian", label: "Indian" }, { value: "multi-cuisine", label: "Multi Cuisine" }, { value: "mughlai", label: "Mughlai" }, { value: "continental", label: "Continental" },
    ]},
    { key: "brand", label: "Brand", type: "radio", options: [
      { value: "unbranded", label: "Unbranded" }, { value: "private-label", label: "Private Label" },
    ]},
    { key: "shelfLife", label: "Shelf Life", type: "radio", options: [
      { value: "12-months", label: "12 Months" }, { value: "18-months", label: "18 Months" }, { value: "24-months", label: "24 Months" },
    ]},
  ],
  // Polished Rice: specific specs when this category is mapped
  polishedRice: [
    { key: "variety", label: "Variety", important: true, type: "radio", options: [
      { value: "basmati", label: "Basmati" }, { value: "swarna", label: "Swarna" }, { value: "ponni", label: "Ponni" },
      { value: "matta", label: "Matta" }, { value: "sona-masoori", label: "Sona Masoori" }, { value: "miniket", label: "Miniket" },
      { value: "gobindobhog", label: "Gobindobhog" }, { value: "ir64", label: "IR 64" }, { value: "sugandha", label: "Sugandha" },
      { value: "japonica", label: "Japonica" }, { value: "other", label: "Other" },
    ]},
    { key: "typeProcessingStyle", label: "Type (Processing Style)", important: true, type: "radio", options: [
      { value: "parboiled-sella", label: "Parboiled (Sella)" }, { value: "brown", label: "Brown" }, { value: "raw", label: "Raw" },
      { value: "golden-sella", label: "Golden Sella" }, { value: "steam", label: "Steam" }, { value: "other", label: "Other" },
    ]},
    { key: "brokenPercentage", label: "Broken Percentage", important: true, type: "radio", options: [
      { value: "5", label: "5%" }, { value: "2", label: "2%" }, { value: "lt1", label: "<1%" },
      { value: "25", label: "25%" }, { value: "10", label: "10%" }, { value: "100", label: "100%" },
      { value: "15", label: "15%" }, { value: "other", label: "Other" },
    ]},
    { key: "grainLength", label: "Grain Length", type: "radio", options: [
      { value: "long-grain", label: "Long Grain" }, { value: "medium-grain", label: "Medium Grain" },
      { value: "short-grain", label: "Short Grain" }, { value: "other", label: "Other" },
    ]},
    { key: "polish", label: "Polish", type: "radio", options: [
      { value: "double-polished", label: "Double Polished" }, { value: "single-polished", label: "Single Polished" },
      { value: "silky-polished", label: "Silky Polished" }, { value: "unpolished", label: "Unpolished" }, { value: "other", label: "Other" },
    ]},
    { key: "packagingSizeRice", label: "Packaging Size", type: "radio", options: [
      { value: "25-kg", label: "25 kg" }, { value: "50-kg", label: "50 kg" }, { value: "10-kg", label: "10 kg" },
      { value: "5-kg", label: "5 kg" }, { value: "1-kg", label: "1 kg" }, { value: "30-kg", label: "30 kg" }, { value: "other", label: "Other" },
    ]},
    { key: "moistureContent", label: "Moisture Content", type: "radio", options: [
      { value: "14-max", label: "14% Max" }, { value: "13-max", label: "13% Max" },
      { value: "12.5-max", label: "12.5% Max" }, { value: "12-max", label: "12% Max" },
    ]},
    { key: "cropYear", label: "Crop Year", type: "radio", options: [
      { value: "current-crop", label: "Current Crop" }, { value: "1-year-old", label: "1-Year Old" }, { value: "2-year-old", label: "2-Year Old" },
    ]},
    { key: "admixture", label: "Admixture", type: "radio", options: [
      { value: "1-max", label: "1% Max" }, { value: "5-max", label: "5% Max" }, { value: "0.5-max", label: "0.5% Max" },
      { value: "0.1-max", label: "0.1% Max" }, { value: "7-max", label: "7% Max" },
    ]},
    { key: "damagedDiscolored", label: "Damaged & Discolored Grains", type: "radio", options: [
      { value: "1-max", label: "1% Max" }, { value: "1.5-max", label: "1.5% Max" },
      { value: "2-max", label: "2% Max" }, { value: "0.5-max", label: "0.5% Max" },
    ]},
  ],
  // Swarna Rice: specific specs when this category is mapped
  swarnaRice: [
    { key: "processing", label: "Processing", important: true, type: "radio", options: [
      { value: "parboiled", label: "Parboiled" }, { value: "raw", label: "Raw" }, { value: "steam", label: "Steam" }, { value: "other", label: "Other" },
    ]},
    { key: "brokenPercentage", label: "Broken Percentage", important: true, type: "radio", options: [
      { value: "25-broken", label: "25% Broken" }, { value: "100-broken", label: "100% Broken" }, { value: "10-broken", label: "10% Broken" },
      { value: "5-broken", label: "5% Broken" }, { value: "other", label: "Other" },
    ]},
    { key: "riceGrade", label: "Rice Grade", important: true, type: "radio", options: [
      { value: "common", label: "Common" }, { value: "premium", label: "Premium" }, { value: "medium-grade", label: "Medium Grade" },
      { value: "faq", label: "FAQ" }, { value: "other", label: "Other" },
    ]},
    { key: "grainType", label: "Grain Type", type: "radio", options: [
      { value: "medium-grain", label: "Medium Grain" }, { value: "long-grain", label: "Long Grain" }, { value: "other", label: "Other" },
    ]},
    { key: "polished", label: "Polished", type: "radio", options: [
      { value: "single-polished", label: "Single Polished" }, { value: "unpolished", label: "Unpolished" },
      { value: "double-polished", label: "Double Polished" }, { value: "sortex-cleaned", label: "Sortex Cleaned" }, { value: "other", label: "Other" },
    ]},
    { key: "moisture", label: "Moisture", type: "radio", options: [
      { value: "14-max", label: "14% Max" }, { value: "13-max", label: "13% Max" }, { value: "12-max", label: "12% Max" }, { value: "other", label: "Other" },
    ]},
    { key: "cropYear", label: "Crop Year", type: "radio", options: [
      { value: "current-year", label: "Current Year" }, { value: "previous-year", label: "Previous Year" },
    ]},
    { key: "sortex", label: "Sortex", type: "radio", options: [
      { value: "sortex", label: "Sortex" }, { value: "non-sortex", label: "Non Sortex" },
    ]},
    { key: "packagingSizeRice", label: "Packaging Size", type: "radio", options: [
      { value: "50-kg", label: "50 kg" }, { value: "25-kg", label: "25 kg" }, { value: "10-kg", label: "10 kg" },
      { value: "90-kg", label: "90 kg" }, { value: "5-kg", label: "5 kg" }, { value: "1000-kg", label: "1000 kg" },
    ]},
  ],
  // Other cereals (Maize, etc.): generic specs
  cereals: [
    { key: "grade", label: "Grade", important: true, type: "radio", options: [
      { value: "premium", label: "Premium" }, { value: "food-grade", label: "Food Grade" }, { value: "a-grade", label: "A Grade" },
      { value: "b-grade", label: "B Grade" }, { value: "standard", label: "Standard" }, { value: "other", label: "Other" },
    ]},
    { key: "cultivationType", label: "Cultivation Type", type: "radio", options: [
      { value: "inorganic", label: "Inorganic" }, { value: "organic", label: "Organic" }, { value: "natural", label: "Natural" }, { value: "other", label: "Other" },
    ]},
    { key: "purity", label: "Purity", type: "radio", options: [
      { value: "99", label: "99 %" }, { value: "98", label: "98 %" }, { value: "97", label: "97 %" }, { value: "other", label: "Other" },
    ]},
    { key: "packagingType", label: "Packaging Type", type: "radio", options: [
      { value: "jute-bag", label: "Jute Bag" }, { value: "pp-bag", label: "PP Bag" }, { value: "hdpe-bag", label: "HDPE Bag" },
      { value: "bulk", label: "Bulk" }, { value: "retail-pack", label: "Retail Pack" },
    ]},
  ],
};
const PACKAGING_SIZES = ["10 kg", "25 kg", "30 kg", "40 kg", "50 kg"];
const CATEGORY_LABELS: Record<string, string> = { cereals: "Cereals" };
// When category is Cereals, product type determines specs: Wheat gets wheat-specific specs; others get generic cereal specs.
const CEREAL_PRODUCT_TYPES = [
  { value: "wheat", label: "Wheat" },
  { value: "rice", label: "Rice" },
  { value: "maize", label: "Maize" },
  { value: "other", label: "Other" },
] as const;

// Rice has many types — user maps categories to get buy leads; specs show after mapping
const RICE_SUB_CATEGORIES = [
  "Basmati Rice",
  "Brown Basmati Rice",
  "Polished Rice",
  "Swarna Rice",
];

interface BusinessDetailsFromSell {
  yourName: string;
  companyName: string;
  pincode: string;
  city: string;
  state: string;
  email: string;
  phone: string;
}

const FarmerRegister = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signUp, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [productTab, setProductTab] = useState<"basic" | "specification">("basic");
  const [isLoading, setIsLoading] = useState(false);
  const [farmerId, setFarmerId] = useState("");
  const businessDetailsFromSell = useRef<BusinessDetailsFromSell | null>(null);

  const DESCRIPTION_MAX = 4000;

  // When coming from Sell (Business Details) or Dashboard "Add Product", skip to Product Info (step 2)
  useEffect(() => {
    const state = location.state as { fromSell?: boolean; businessDetails?: BusinessDetailsFromSell; addProductOnly?: boolean } | null;
    if (state?.addProductOnly) {
      setStep(2);
      return;
    }
    if (state?.fromSell && state?.businessDetails && !businessDetailsFromSell.current) {
      const b = state.businessDetails;
      businessDetailsFromSell.current = b;
      const address = [b.companyName, b.city, b.state, b.pincode].filter(Boolean).join(", ");
      setFormData((prev) => ({
        ...prev,
        fullName: b.yourName?.trim() || prev.fullName,
        phone: b.phone?.trim() || prev.phone,
        address: address || prev.address,
        state: b.state?.trim() || prev.state,
        pincode: b.pincode?.trim() || prev.pincode,
        email: b.email?.trim() || prev.email,
      }));
      setStep(2);
    }
  }, [location.state]);

  // When coming from Sell (step 2) and user is logged in: create farmer profile immediately
  // so Seller Dashboard opens and shows their details even before they add a product
  useEffect(() => {
    if (authLoading || !user || step !== 2 || !businessDetailsFromSell.current) return;

    const createFarmerFromSell = async () => {
      const { data: existing } = await supabase
        .from("farmers")
        .select("id, farmer_display_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        setFarmerId(existing.farmer_display_id);
        return;
      }

      const b = businessDetailsFromSell.current;
      const fullAddress = [b.companyName, b.city, b.state, b.pincode].filter(Boolean).join(", ") || "Address not provided";
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        full_name: (b.yourName || "").trim() || "Seller",
        address: fullAddress,
        contact_number: (b.phone || "").trim() || "Not provided",
        aadhar_number: (b as { aadharNumber?: string }).aadharNumber?.trim() || "Pending",
      };

      const { data: created, error } = await supabase
        .from("farmers")
        .insert(insertData)
        .select()
        .single();

      if (error) {
        if (error.message?.toLowerCase().includes("duplicate") || error.message?.toLowerCase().includes("unique")) return;
        if (import.meta.env.DEV) console.error("Create farmer from Sell:", error);
        return;
      }
      if (created?.farmer_display_id) setFarmerId(created.farmer_display_id);
      await supabase.from("user_roles").upsert({ user_id: user.id, role: "farmer" });
    };

    createFarmerFromSell();
  }, [user, authLoading, step]);

  const [formData, setFormData] = useState({
    // Auth Details
    email: "",
    password: "",
    confirmPassword: "",
    // Personal Details
    fullName: "",
    aadharNumber: "",
    phone: "",
    address: "",
    state: "",
    pincode: "",
    // Product Details
    productName: "",
    category: "",
    price: "",
    quantity: "",
    unit: "kg",
    validity: "",
    negotiable: false,
    description: "",
    features: "",
    // Specifications
    grade: "",
    moistureContent: "",
    purity: "",
    origin: "",
    harvestDate: "",
    // Additional details (Specification tab)
    packagingSize: "",
    minOrderQty: "",
    minOrderUnit: "Kg",
    productionCapacity: "",
    productCode: "",
    deliveryTime: "",
    packagingDetails: "",
    productType: "", // For cereals only: wheat | rice | maize | other — wheat shows wheat-specific specs
  });
  const [productSpecs, setProductSpecs] = useState<Record<string, string | string[]>>({});
  const [specSearch, setSpecSearch] = useState("");
  const [customPackagingSizes, setCustomPackagingSizes] = useState<string[]>([]);
  const [mappedRiceCategories, setMappedRiceCategories] = useState<string[]>([]);
  const [riceCategoryPopoverOpen, setRiceCategoryPopoverOpen] = useState(false);
  const [riceAddCategoryPopoverOpen, setRiceAddCategoryPopoverOpen] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === "category" && value !== "cereals") next.productType = "";
      if (field === "productType" && value !== "rice") setMappedRiceCategories([]);
      return next;
    });
  };

  const handleSpecChange = (key: string, value: string | string[], type: "radio" | "checkbox") => {
    setProductSpecs(prev => ({ ...prev, [key]: value }));
  };

  const handleSpecCheckboxToggle = (key: string, optionValue: string, checked: boolean) => {
    setProductSpecs(prev => {
      const current = (prev[key] as string[] | undefined) || [];
      const next = checked ? [...current, optionValue] : current.filter(v => v !== optionValue);
      return { ...prev, [key]: next };
    });
  };

  // Wheat specs only when category is Cereals AND product type is Wheat; otherwise use category's specs.
  const specsKey =
    formData.category === "cereals" && formData.productType === "wheat" ? "wheat"
    : formData.category === "cereals" && formData.productType === "rice" ? "rice"
    : formData.category;
  const categorySpecs = formData.category ? (SPECS_BY_CATEGORY[specsKey] || []) : [];
  const filteredCategorySpecs = specSearch.trim()
    ? categorySpecs.filter(g => g.label.toLowerCase().includes(specSearch.toLowerCase()))
    : categorySpecs;
  // Rice: which spec set to show based on mapped category (priority: Polished > Brown Basmati > Swarna > generic rice)
  const riceSpecsList = mappedRiceCategories.includes("Polished Rice")
    ? (SPECS_BY_CATEGORY.polishedRice || [])
    : mappedRiceCategories.includes("Brown Basmati Rice")
    ? (SPECS_BY_CATEGORY.brownBasmatiRice || [])
    : mappedRiceCategories.includes("Swarna Rice")
    ? (SPECS_BY_CATEGORY.swarnaRice || [])
    : (SPECS_BY_CATEGORY.rice || []);
  const filteredRiceSpecs = specSearch.trim()
    ? riceSpecsList.filter(g => g.label.toLowerCase().includes(specSearch.toLowerCase()))
    : riceSpecsList;
  const allPackagingSizes = [...PACKAGING_SIZES, ...customPackagingSizes];
  const showCategoryPicker = !formData.category;
  const categoryLabel = formData.category ? (CATEGORY_LABELS[formData.category] || formData.category) + (formData.category === "cereals" && formData.productType ? ` (${CEREAL_PRODUCT_TYPES.find(t => t.value === formData.productType)?.label || formData.productType})` : "") : "";
  const setCategoryFromPicker = (value: string) => handleInputChange("category", value);
  const isCereals = formData.category === "cereals";

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate based on whether user is logged in or not
    if (!user) {
      // If not logged in, check email and password fields individually
      if (!formData.email || !formData.email.trim()) {
        toast.error("Email Address is required");
        return;
      }
      
      // Basic email check - just ensure it contains @
      if (!formData.email.trim().includes('@')) {
        toast.error("Please enter a valid email address");
        return;
      }

      if (!formData.password || !formData.password.trim()) {
        toast.error("Password is required");
        return;
      }

      if (formData.password.trim().length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }

      if (!formData.confirmPassword || !formData.confirmPassword.trim()) {
        toast.error("Please confirm your password");
        return;
      }

      if (formData.password.trim() !== formData.confirmPassword.trim()) {
        toast.error("Passwords do not match");
        return;
      }
    }
    
    // Check required personal details fields individually (always required)
    // Trim values to handle whitespace-only inputs
    if (!formData.fullName || !formData.fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    
    if (!formData.aadharNumber || !formData.aadharNumber.trim()) {
      toast.error("Aadhar Number is required");
      return;
    }
    
    if (!formData.phone || !formData.phone.trim()) {
      toast.error("Phone Number is required");
      return;
    }
    
    if (!formData.address || !formData.address.trim()) {
      toast.error("Full Address is required");
      return;
    }

    setIsLoading(true);

    // Get current session first - this is the source of truth
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    // If user is not logged in, create account first
    let currentUser = user;
    let authenticatedUserId = null;
    
    if (!user || !currentSession) {
      // User not logged in - need to create account
      const { data, error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
      if (error) {
        setIsLoading(false);
        // Handle various Supabase error messages
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes("already registered") || 
            errorMessage.includes("user already registered") ||
            errorMessage.includes("email already in use") ||
            errorMessage.includes("already exists")) {
          toast.error("This email is already registered. Please use a different email or login instead.");
        } else if (errorMessage.includes("password")) {
          toast.error("Password must be at least 6 characters");
        } else if (errorMessage.includes("48 seconds") || 
                   errorMessage.includes("rate limit") || 
                   errorMessage.includes("security purposes") ||
                   errorMessage.includes("wait")) {
          toast.error("Please wait a moment and try again");
        } else {
          toast.error(error.message || "Registration failed. Please try again.");
        }
        return;
      }
      
      // Wait for session to be established after signup
      let attempts = 0;
      const maxAttempts = 20;
      let newSession = null;
      
      while (attempts < maxAttempts) {
        const { data: { session: checkSession } } = await supabase.auth.getSession();
        if (checkSession?.user) {
          newSession = checkSession;
          currentUser = checkSession.user;
          authenticatedUserId = checkSession.user.id;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }
      
      if (!newSession || !authenticatedUserId) {
        setIsLoading(false);
        toast.error("Account created! Please wait a moment and refresh the page, then continue.");
        return;
      }
    } else {
      // User is already logged in - use existing session
      if (currentSession?.user) {
        currentUser = currentSession.user;
        authenticatedUserId = currentSession.user.id;
        
        // Refresh token if it's about to expire
        const expiresAt = currentSession.expires_at;
        const now = Math.floor(Date.now() / 1000);
        if (expiresAt && expiresAt - now < 60) {
          await supabase.auth.refreshSession();
        }
      } else {
        setIsLoading(false);
        toast.error("Session not found. Please refresh the page and try again.");
        return;
      }
    }
    
    // Final check - ensure we have a valid user ID
    if (!authenticatedUserId || !currentUser) {
      setIsLoading(false);
      toast.error("Authentication error. Please refresh the page and try again.");
      return;
    }
    
    // Ensure authenticatedUserId matches currentUser (use session user ID as source of truth)
    if (currentUser.id !== authenticatedUserId) {
      // Use the session user ID as it's the authenticated one
      authenticatedUserId = currentUser.id;
    }

    // Prepare insert data - ensure all values are trimmed and valid
    const trimmedFullName = formData.fullName.trim();
    const trimmedAadhar = formData.aadharNumber.trim();
    const trimmedPhone = formData.phone.trim();
    const trimmedAddress = formData.address.trim();
    
    // Validate trimmed values one more time before insert
    if (!trimmedFullName || !trimmedAadhar || !trimmedPhone || !trimmedAddress) {
      setIsLoading(false);
      if (!trimmedFullName) toast.error("Full Name is required");
      else if (!trimmedAadhar) toast.error("Aadhar Number is required");
      else if (!trimmedPhone) toast.error("Phone Number is required");
      else if (!trimmedAddress) toast.error("Full Address is required");
      return;
    }
    
    // Prepare address - combine address, state, and pincode
    let fullAddress = trimmedAddress;
    if (formData.state && formData.state.trim()) {
      fullAddress += `, ${formData.state.trim()}`;
    }
    if (formData.pincode && formData.pincode.trim()) {
      fullAddress += ` - ${formData.pincode.trim()}`;
    }
    
    const insertData: Record<string, unknown> = {
      user_id: authenticatedUserId,
      full_name: trimmedFullName,
      address: fullAddress,
      aadhar_number: trimmedAadhar,
      contact_number: trimmedPhone,
    };
    // Do not include pan_number — column was removed in migration 20260126000000_remove_pan_number.sql

    // Create farmer profile with automatic retry on RLS/auth errors (silent retry)
    let farmerData = null;
    let farmerError = null;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      const { data, error } = await supabase
        .from('farmers')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        const errorMessage = error.message.toLowerCase();
        
        // If it's an RLS/auth error and we haven't retried yet, refresh session and retry silently
        if ((errorMessage.includes("row-level security") || 
             errorMessage.includes("violates") || 
             errorMessage.includes("policy") ||
             errorMessage.includes("permission denied") ||
             errorMessage.includes("jwt") ||
             errorMessage.includes("expired") ||
             errorMessage.includes("token")) && retryCount < maxRetries) {
          // Refresh session and retry silently (no error shown to user)
          await supabase.auth.refreshSession();
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        
        farmerError = error;
        break;
      } else {
        farmerData = data;
        break;
      }
    }

    if (farmerError) {
      setIsLoading(false);
      // Log the actual error for debugging (in development)
      if (import.meta.env.DEV) {
        console.error("Farmer profile creation error:", farmerError);
      }
      
      // Handle errors with user-friendly messages (no "Authentication issue" shown)
      const errorMessage = farmerError.message.toLowerCase();
      if (errorMessage.includes("duplicate") || errorMessage.includes("already exists") || errorMessage.includes("unique")) {
        toast.error("You already have a farmer profile. Please login to access it.");
      } else if (errorMessage.includes("not null") || errorMessage.includes("null value")) {
        // Check which specific field is missing
        if (errorMessage.includes("full_name") || errorMessage.includes("full name")) {
          toast.error("Full Name is required");
        } else if (errorMessage.includes("aadhar") || errorMessage.includes("aadhar_number")) {
          toast.error("Aadhar Number is required");
        } else if (errorMessage.includes("phone") || errorMessage.includes("contact_number")) {
          toast.error("Phone Number is required");
        } else if (errorMessage.includes("address")) {
          toast.error("Full Address is required");
        } else {
          toast.error("Please fill all required fields");
        }
      } else if (errorMessage.includes("pan_number")) {
        toast.error("Database configuration issue. Please contact support.");
      } else {
        // Generic error - don't show technical details or authentication errors
        toast.error("Unable to create profile. Please check all fields and try again.");
      }
      return;
    }

    // Update user role to farmer
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: authenticatedUserId,
        role: 'farmer'
      });

    if (roleError) {
      console.error("Failed to update role:", roleError);
      // Don't fail the registration for this
    }

    setFarmerId(farmerData.farmer_display_id);
    setIsLoading(false);
    toast.success("Profile created successfully! Now add your product details.");
    // Move to step 2 (product creation page)
    setStep(2);
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check each required field individually and show specific error
    // Trim values to handle whitespace-only inputs
    if (!formData.productName || !formData.productName.trim()) {
      toast.error("Product Name is required");
      return;
    }
    
    if (!formData.category || !formData.category.trim()) {
      toast.error("Category is required");
      return;
    }
    
    if (!formData.price || !formData.price.trim()) {
      toast.error("Price is required");
      return;
    }
    
    if (!formData.validity || !formData.validity.trim()) {
      toast.error("Product Validity is required");
      return;
    }

    setIsLoading(true);

    // Use user from auth context, or get current session (in case context is stale)
    let currentUser = user;
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentUser && currentSession?.user) {
      currentUser = currentSession.user;
    }
    if (!currentUser) {
      setIsLoading(false);
      toast.error("Please log in to add a product. You need an account to list products.");
      return;
    }

    // Refresh session before database operations to avoid JWT expiration
    if (currentSession) {
      const expiresAt = currentSession.expires_at;
      const now = Math.floor(Date.now() / 1000);
      if (expiresAt && expiresAt - now < 60) {
        await supabase.auth.refreshSession();
      }
    }

    let farmerProfileData = await supabase
      .from('farmers')
      .select('id, full_name, farmer_display_id, is_verified, address, contact_number, gst_number')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    // When coming from Sell (Business Details), create farmer profile first if not found
    if (!farmerProfileData.data && businessDetailsFromSell.current) {
      const b = businessDetailsFromSell.current;
      const fullAddress = [b.companyName, b.city, b.state, b.pincode].filter(Boolean).join(", ") || "Address not provided";
      const insertData: Record<string, unknown> = {
        user_id: currentUser.id,
        full_name: (b.yourName || "").trim() || "Seller",
        address: fullAddress,
        contact_number: (b.phone || "").trim() || "Not provided",
        aadhar_number: (b as { aadharNumber?: string }).aadharNumber?.trim() || "",
      };

      let retryCount = 0;
      const maxRetries = 2;
      let createError: { message?: string } | null = null;
      let payloadToUse: Record<string, unknown> = insertData;

      while (retryCount <= maxRetries) {
        const { data: created, error } = await supabase
          .from('farmers')
          .insert(payloadToUse)
          .select()
          .single();
        if (error) {
          const msg = error.message.toLowerCase();
          if ((msg.includes("row-level security") || msg.includes("policy") || msg.includes("jwt") || msg.includes("expired")) && retryCount < maxRetries) {
            await supabase.auth.refreshSession();
            retryCount++;
            await new Promise((r) => setTimeout(r, 500));
            continue;
          }
          // If DB still has pan_number NOT NULL and we didn't send it, retry once with pan_number
          if (msg.includes("pan_number") && msg.includes("null") && !payloadToUse.pan_number) {
            payloadToUse = { ...insertData, pan_number: "" };
            retryCount = 0;
            continue;
          }
          if (import.meta.env.DEV) console.error("Farmer profile creation (Sell flow):", error);
          createError = error;
          break;
        }
        farmerProfileData = { data: created as typeof farmerProfileData.data } as typeof farmerProfileData;
        if (created?.farmer_display_id) setFarmerId(created.farmer_display_id);
        await supabase.from('user_roles').upsert({ user_id: currentUser.id, role: 'farmer' });
        break;
      }
      if (createError) {
        setIsLoading(false);
        const errMsg = (createError as { message?: string }).message?.toLowerCase() || "";
        if (errMsg.includes("pan_number") || (errMsg.includes("null value") && errMsg.includes("pan"))) {
          toast.error("Database needs update: run in Supabase SQL Editor: ALTER TABLE public.farmers DROP COLUMN IF EXISTS pan_number;");
        } else if (errMsg.includes("duplicate") || errMsg.includes("unique") || errMsg.includes("already exists")) {
          toast.error("You already have a farmer profile. Refreshing…");
          window.location.reload();
        } else if (errMsg.includes("row-level security") || errMsg.includes("policy") || errMsg.includes("jwt")) {
          toast.error("Session expired. Please log in again and try again.");
        } else {
          toast.error(createError.message || "Unable to create profile. Please try again.");
        }
        return;
      }
    }

    const farmerProfile = farmerProfileData.data;
    if (!farmerProfile) {
      setIsLoading(false);
      toast.error("Farmer profile not found. Please complete Business Details first.");
      return;
    }

    // Calculate expiry date based on validity (save to database: 1, 5, 10, or 30 days)
    const validityMatch = formData.validity.match(/(\d+)/);
    const rawDays = validityMatch ? parseInt(validityMatch[1], 10) : 1;
    const validityDays = [1, 5, 10, 30].includes(rawDays) ? rawDays : Math.min(365, Math.max(1, rawDays));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Build features array: existing features + dynamic specs + additional details
    const featureList: string[] = formData.features ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : [];
    Object.entries(productSpecs).forEach(([key, val]) => {
      if (Array.isArray(val)) featureList.push(`spec:${key}=${val.join(",")}`);
      else if (val) featureList.push(`spec:${key}=${val}`);
    });
    if (formData.category === "cereals" && formData.productType) featureList.push(`productType:${formData.productType}`);
    if (formData.productType === "rice" && mappedRiceCategories.length > 0) featureList.push(`mappedCategories:${mappedRiceCategories.join(",")}`);
    if (formData.packagingSize) featureList.push(`packagingSize:${formData.packagingSize}`);
    if (formData.minOrderQty) featureList.push(`minOrderQty:${formData.minOrderQty} ${formData.minOrderUnit}`);
    if (formData.productionCapacity) featureList.push(`productionCapacity:${formData.productionCapacity}`);
    if (formData.productCode) featureList.push(`productCode:${formData.productCode}`);
    if (formData.deliveryTime) featureList.push(`deliveryTime:${formData.deliveryTime}`);
    if (formData.packagingDetails) featureList.push(`packagingDetails:${formData.packagingDetails}`);

    const gradeVal = (productSpecs.grade as string) || formData.grade || null;
    const purityVal = (productSpecs.purity as string) || formData.purity;
    const moistureVal = (productSpecs.moisture as string) || formData.moistureContent;
    const moistureNum = moistureVal ? parseFloat(moistureVal) : null;
    const purityNum = purityVal ? parseFloat(purityVal) : null;

    // Direct insert into Supabase database — product details are saved to DB when user clicks Finish
    const { error: productError } = await supabase
      .from('products')
      .insert({
        farmer_id: farmerProfile.id,
        name: formData.productName,
        category: formData.category,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: formData.quantity || "0",
        unit: formData.unit,
        is_negotiable: formData.negotiable,
        validity_days: validityDays,
        expires_at: expiresAt.toISOString(),
        features: featureList.length ? featureList : null,
        grade: gradeVal || null,
        moisture_content: moistureNum,
        purity: purityNum,
        origin: formData.origin || null,
        harvest_date: formData.harvestDate || null,
      });

    setIsLoading(false);

    if (productError) {
      // Handle errors with user-friendly messages
      const errorMessage = productError.message.toLowerCase();
      if (errorMessage.includes("row-level security") || 
          errorMessage.includes("violates") || 
          errorMessage.includes("policy")) {
        toast.error("Unable to create product. Please make sure you're logged in and try again.");
      } else if (errorMessage.includes("duplicate") || errorMessage.includes("already exists")) {
        toast.error("This product already exists. Please try again.");
      } else {
        toast.error("Unable to create product. Please check all fields and try again.");
      }
      return;
    }

    // Success - pass farmer data so dashboard shows it immediately (avoids DB timing delay)
    const farmerForDashboard = farmerProfileData.data as { id: string; full_name: string; farmer_display_id: string; is_verified?: boolean; address?: string | null; contact_number?: string | null; gst_number?: string | null } | undefined;
    const addProductOnly = (location.state as { addProductOnly?: boolean } | null)?.addProductOnly;
    if (addProductOnly) {
      toast.success("Product added successfully.");
      navigate("/farmer-dashboard", { state: { fromRegistration: true, farmerData: farmerForDashboard } });
      return;
    }
    toast.success("Registration complete! Taking you to your seller dashboard…");
    navigate("/farmer-dashboard", { state: { fromRegistration: true, farmerData: farmerForDashboard } });
  };

  const handleAddAnotherProduct = () => {
    setFormData(prev => ({
      ...prev,
      productName: "",
      category: "",
      price: "",
      quantity: "",
      unit: "kg",
      validity: "",
      negotiable: false,
      description: "",
      features: "",
      grade: "",
      moistureContent: "",
      purity: "",
      origin: "",
      harvestDate: "",
      packagingSize: "",
      minOrderQty: "",
      minOrderUnit: "Kg",
      productionCapacity: "",
      productCode: "",
      deliveryTime: "",
      packagingDetails: "",
      productType: "",
    }));
    setProductSpecs({});
    setSpecSearch("");
    setCustomPackagingSizes([]);
    setMappedRiceCategories([]);
    setRiceCategoryPopoverOpen(false);
    setRiceAddCategoryPopoverOpen(false);
    setStep(2);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <Badge variant="success" className="mb-4">Farmer Registration</Badge>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
                Register Your Farm Products
              </h1>
              <p className="text-muted-foreground">
                Complete your registration to start selling directly to consumers
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-10">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step >= s ? "bg-gradient-hero text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                  </div>
                  <span className={`text-sm font-medium hidden sm:block ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                    {s === 1 ? "Personal Details" : s === 2 ? "Product Info" : "Complete"}
                  </span>
                  {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-border"}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <Card className="animate-fade-up">
                <CardHeader>
                  <CardTitle className="font-serif">Personal & Contact Details</CardTitle>
                  <CardDescription>Please provide accurate information for verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitStep1} className="space-y-6">
                    {!user && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="farmer@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="password">Password *</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Min 6 characters"
                              value={formData.password}
                              onChange={(e) => handleInputChange("password", e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password *</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm password"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <Input
                          id="fullName"
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange("fullName", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 XXXXX XXXXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange("phone", e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                      <Input
                        id="aadharNumber"
                        placeholder="XXXX XXXX XXXX"
                        value={formData.aadharNumber}
                        onChange={(e) => handleInputChange("aadharNumber", e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address *</Label>
                      <Textarea
                        id="address"
                        placeholder="Village, District, State"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Select value={formData.state} onValueChange={(value) => handleInputChange("state", value)} disabled={isLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                            <SelectItem value="karnataka">Karnataka</SelectItem>
                            <SelectItem value="maharashtra">Maharashtra</SelectItem>
                            <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                            <SelectItem value="telangana">Telangana</SelectItem>
                            <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          placeholder="XXXXXX"
                          value={formData.pincode}
                          onChange={(e) => handleInputChange("pincode", e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Product Details <ArrowRight className="w-5 h-5" /></>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Product Details – Basic Details + Specification/Additional Details (image-style) */}
            {step === 2 && (
              <Card className="animate-fade-up overflow-hidden">
                {!user && (
                  <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      You must be logged in to add a product. Your product will be saved to your account.
                    </p>
                    <Link
                      to="/login"
                      state={{ from: "/farmer-register", ...(location.state as object || {}) }}
                      className="text-sm font-medium text-amber-700 dark:text-amber-300 underline hover:no-underline"
                    >
                      Log in
                    </Link>
                  </div>
                )}
                {/* Header: Back, product name, tabs */}
                <div className="border-b border-border px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground -ml-2"
                      onClick={() => (productTab === "specification" ? setProductTab("basic") : (location.state as { addProductOnly?: boolean } | null)?.addProductOnly ? navigate("/farmer-dashboard") : businessDetailsFromSell.current ? navigate("/sell") : setStep(1))}
                    >
                      ← Back
                    </Button>
                    <span className="font-semibold text-foreground">
                      {productTab === "specification" && formData.category ? (CATEGORY_LABELS[formData.category] || formData.category) : (formData.productName || "Add Product")}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${productTab === "basic" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      onClick={() => setProductTab("basic")}
                    >
                      Basic Details
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${productTab === "specification" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                      onClick={() => setProductTab("specification")}
                    >
                      Specification/Additional Details
                    </button>
                  </div>
                </div>

                <CardContent className="p-0">
                  <form onSubmit={handleSubmitStep2} id="product-details-form" className="block">
                    {productTab === "basic" && (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-6">
                        {/* Left: Media upload */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex gap-2 flex-wrap">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors shrink-0">
                                <Camera className="w-5 h-5 text-muted-foreground" />
                                <span className="sr-only">Add photo</span>
                              </div>
                            ))}
                          </div>
                          <div className="rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center min-h-[180px] cursor-pointer hover:border-primary transition-colors p-4">
                            <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                            <span className="text-sm font-medium text-muted-foreground">Add Photo</span>
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" className="flex-1 gap-2">
                              <Video className="w-4 h-4" /> Add Video
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="flex-1 gap-2">
                              <FileText className="w-4 h-4" /> Add PDF
                            </Button>
                          </div>
                          <div className="rounded-lg bg-muted/50 p-3 flex gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs text-muted-foreground">
                              <p className="font-medium text-foreground mb-1">Tips</p>
                              <p>Add clear photos and a short description. Mention uses, benefits and quality to attract buyers.</p>
                            </div>
                          </div>
                        </div>

                        {/* Right: Basic Details form */}
                        <div className="lg:col-span-3 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="productName">Product/Service Name *</Label>
                            <Input
                              id="productName"
                              placeholder="e.g., Beans"
                              value={formData.productName}
                              onChange={(e) => handleInputChange("productName", e.target.value)}
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Price *</Label>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-muted-foreground">₹</span>
                              <Input
                                id="price"
                                type="number"
                                placeholder="20"
                                value={formData.price}
                                onChange={(e) => handleInputChange("price", e.target.value)}
                                className="w-24"
                                required
                                disabled={isLoading}
                              />
                              <span className="text-muted-foreground">- per -</span>
                              <Select value={formData.unit} onValueChange={(v) => handleInputChange("unit", v)} disabled={isLoading}>
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kg">Kg</SelectItem>
                                  <SelectItem value="quintal">Quintal</SelectItem>
                                  <SelectItem value="ton">Ton</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="description">Product/Service Description</Label>
                              <span className="text-xs text-muted-foreground">
                                {(formData.description || "").length} character (maximum of {DESCRIPTION_MAX}) including formatting.
                              </span>
                            </div>
                            <Textarea
                              id="description"
                              placeholder="Uses, Details, Benefits, etc."
                              value={formData.description}
                              onChange={(e) => handleInputChange("description", e.target.value.slice(0, DESCRIPTION_MAX))}
                              rows={6}
                              className="resize-y"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                              onClick={() => setProductTab("specification")}
                            >
                              Save and Continue <ArrowRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {productTab === "specification" && (
                      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                        {/* Category pill + edit */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-muted-foreground">Categories</span>
                          <button type="button" className="rounded-full p-0.5 text-muted-foreground hover:text-foreground" aria-label="Help">
                            <HelpCircle className="w-4 h-4" />
                          </button>
                          {showCategoryPicker ? (
                            <Select value={formData.category} onValueChange={setCategoryFromPicker} disabled={isLoading}>
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cereals">Cereals</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                              <span>{categoryLabel}</span>
                              <button
                                type="button"
                                onClick={() => setCategoryFromPicker("")}
                                className="rounded p-0.5 hover:bg-muted"
                                aria-label="Change category"
                              >
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Product type (Cereals only): Wheat / Rice / etc. */}
                        {isCereals && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm text-muted-foreground">Product type</span>
                            <Select value={formData.productType} onValueChange={(v) => handleInputChange("productType", v)} disabled={isLoading}>
                              <SelectTrigger className="w-[160px] h-9">
                                <SelectValue placeholder="Select type (e.g. Wheat)" />
                              </SelectTrigger>
                              <SelectContent>
                                {CEREAL_PRODUCT_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground">Select Wheat or Rice for type-specific specifications.</span>
                          </div>
                        )}

                        {/* Rice: Categories — map category to get buy leads; + Add opens map category */}
                        {formData.productType === "rice" && (
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-foreground">Categories</span>
                              <button type="button" className="rounded-full p-0.5 text-muted-foreground hover:text-foreground" aria-label="Help">
                                <HelpCircle className="w-4 h-4" />
                              </button>
                              {mappedRiceCategories.length === 0 ? (
                                <Popover open={riceCategoryPopoverOpen} onOpenChange={setRiceCategoryPopoverOpen}>
                                  <PopoverTrigger asChild>
                                    <Button type="button" variant="link" className="h-auto p-0 text-primary font-normal text-sm gap-1">
                                      <Plus className="w-4 h-4" /> Add category to get buy leads from relevant customers
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80" align="start">
                                    <p className="text-sm font-medium mb-3">Map category</p>
                                    <p className="text-xs text-muted-foreground mb-3">Select one or more rice types. Specifications will appear after you map categories.</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {RICE_SUB_CATEGORIES.map((name) => (
                                        <div key={name} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`rice-cat-${name}`}
                                            checked={mappedRiceCategories.includes(name)}
                                            onCheckedChange={(c) => {
                                              setMappedRiceCategories(prev => c ? [...prev, name] : prev.filter(x => x !== name));
                                            }}
                                          />
                                          <Label htmlFor={`rice-cat-${name}`} className="text-sm font-normal cursor-pointer">{name}</Label>
                                        </div>
                                      ))}
                                    </div>
                                    <Button type="button" size="sm" className="mt-3 w-full" onClick={() => setRiceCategoryPopoverOpen(false)}>
                                      Done
                                    </Button>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                  {mappedRiceCategories.map((name) => (
                                    <span key={name} className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                                      {name}
                                      <button type="button" onClick={() => setMappedRiceCategories(prev => prev.filter(x => x !== name))} className="rounded p-0.5 hover:bg-muted" aria-label={`Remove ${name}`}>
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                  <Popover open={riceAddCategoryPopoverOpen} onOpenChange={setRiceAddCategoryPopoverOpen}>
                                    <PopoverTrigger asChild>
                                      <Button type="button" variant="link" className="h-auto p-0 text-primary font-normal text-sm gap-1">
                                        <Plus className="w-4 h-4" /> Add category
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80" align="start">
                                      <p className="text-sm font-medium mb-3">Map category</p>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {RICE_SUB_CATEGORIES.filter(n => !mappedRiceCategories.includes(n)).map((name) => (
                                          <div key={name} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`rice-add-${name}`}
                                              onCheckedChange={() => setMappedRiceCategories(prev => [...prev, name])}
                                            />
                                            <Label htmlFor={`rice-add-${name}`} className="text-sm font-normal cursor-pointer">{name}</Label>
                                          </div>
                                        ))}
                                        {RICE_SUB_CATEGORIES.every(n => mappedRiceCategories.includes(n)) && (
                                          <p className="text-xs text-muted-foreground">All categories added.</p>
                                        )}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Specifications: for Rice show only after category mapped; else normal */}
                        {formData.category && (isCereals ? formData.productType : true) && formData.productType !== "rice" && (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <h3 className="font-semibold text-foreground">Specifications</h3>
                              <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search from available Specifications..."
                                  value={specSearch}
                                  onChange={(e) => setSpecSearch(e.target.value)}
                                  className="pl-8"
                                />
                              </div>
                            </div>
                            <p className="text-sm text-teal-600">Highlighted Specifications are used by most customers!</p>

                            {/* Dynamic spec groups (radio / checkbox) */}
                            <div className="space-y-6">
                              {filteredCategorySpecs.map((group) => (
                                <div key={group.key} className="space-y-2">
                                  <Label className="text-sm font-medium flex items-center gap-1.5">
                                    {group.label}
                                    {group.important && (
                                      <span className="text-green-600 text-xs font-normal">(Important)</span>
                                    )}
                                  </Label>
                                  {group.type === "radio" ? (
                                    <RadioGroup
                                      value={(productSpecs[group.key] as string) || ""}
                                      onValueChange={(v) => handleSpecChange(group.key, v, "radio")}
                                      className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                                    >
                                      {group.options.map((opt) => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                          <RadioGroupItem value={opt.value} id={`${group.key}-${opt.value}`} disabled={isLoading} />
                                          <Label htmlFor={`${group.key}-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                      {group.options.map((opt) => (
                                        <div key={opt.value} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`${group.key}-${opt.value}`}
                                            checked={((productSpecs[group.key] as string[] | undefined) || []).includes(opt.value)}
                                            onCheckedChange={(c) => handleSpecCheckboxToggle(group.key, opt.value, !!c)}
                                            disabled={isLoading}
                                          />
                                          <Label htmlFor={`${group.key}-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {filteredCategorySpecs.length > 0 && (
                              <div className="flex justify-center pt-2">
                                <Button
                                  type="button"
                                  variant="link"
                                  size="sm"
                                  className="text-primary h-auto p-0 gap-1"
                                  onClick={() => document.getElementById("additional-details-section")?.scrollIntoView({ behavior: "smooth" })}
                                >
                                  <Plus className="w-4 h-4" /> Add more
                                </Button>
                              </div>
                            )}
                          </>
                        )}

                        {/* Rice: Specifications — show only after category mapped */}
                        {formData.productType === "rice" && (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-foreground">Specifications</h3>
                            {mappedRiceCategories.length === 0 ? (
                              <p className="text-sm text-muted-foreground">Please map category to add specification.</p>
                            ) : (
                              <>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  <div className="relative flex-1 max-w-sm">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      placeholder="Search from available Specifications..."
                                      value={specSearch}
                                      onChange={(e) => setSpecSearch(e.target.value)}
                                      className="pl-8"
                                    />
                                  </div>
                                </div>
                                <p className="text-sm text-teal-600">Highlighted Specifications are used by most customers!</p>
                                <div className="space-y-6">
                                  {filteredRiceSpecs.map((group) => (
                                    <div key={group.key} className="space-y-2">
                                      <Label className="text-sm font-medium flex items-center gap-1.5">
                                        {group.label}
                                        {group.important && (
                                          <span className="text-green-600 text-xs font-normal">(Important)</span>
                                        )}
                                      </Label>
                                      {group.type === "radio" ? (
                                        <RadioGroup
                                          value={(productSpecs[group.key] as string) || ""}
                                          onValueChange={(v) => handleSpecChange(group.key, v, "radio")}
                                          className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                                        >
                                          {group.options.map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-2">
                                              <RadioGroupItem value={opt.value} id={`rice-${group.key}-${opt.value}`} disabled={isLoading} />
                                              <Label htmlFor={`rice-${group.key}-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                                            </div>
                                          ))}
                                        </RadioGroup>
                                      ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                          {group.options.map((opt) => (
                                            <div key={opt.value} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`rice-${group.key}-${opt.value}`}
                                                checked={((productSpecs[group.key] as string[] | undefined) || []).includes(opt.value)}
                                                onCheckedChange={(c) => handleSpecCheckboxToggle(group.key, opt.value, !!c)}
                                                disabled={isLoading}
                                              />
                                              <Label htmlFor={`rice-${group.key}-${opt.value}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Packaging Size */}
                        {formData.category && (
                        <div className="space-y-2">
                          <Label>Packaging Size</Label>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            <RadioGroup
                              value={formData.packagingSize}
                              onValueChange={(v) => handleInputChange("packagingSize", v)}
                              className="flex flex-wrap gap-x-4 gap-y-2"
                            >
                              {allPackagingSizes.map((size) => (
                                <div key={size} className="flex items-center space-x-2">
                                  <RadioGroupItem value={size} id={`pack-${size}`} disabled={isLoading} />
                                  <Label htmlFor={`pack-${size}`} className="text-sm font-normal cursor-pointer">{size}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="text-primary h-auto p-0 gap-1"
                              onClick={() => {
                                const custom = window.prompt("Add packaging size (e.g. 20 kg)");
                                if (custom?.trim() && !customPackagingSizes.includes(custom.trim())) {
                                  setCustomPackagingSizes(prev => [...prev, custom.trim()]);
                                }
                              }}
                            >
                              <Plus className="w-4 h-4" /> Add more
                            </Button>
                          </div>
                        </div>
                        )}

                        {/* Additional Details */}
                        <div id="additional-details-section" className="border-t pt-6 space-y-4">
                          <h3 className="font-semibold text-foreground underline decoration-primary/30">Additional Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="minOrderQty">Minimum Order Quantity</Label>
                              <div className="flex gap-2">
                                <Input
                                  id="minOrderQty"
                                  type="text"
                                  placeholder="e.g. 100"
                                  value={formData.minOrderQty}
                                  onChange={(e) => handleInputChange("minOrderQty", e.target.value)}
                                  disabled={isLoading}
                                />
                                <Input
                                  value={formData.minOrderUnit}
                                  readOnly
                                  className="w-16 bg-muted text-center"
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="productionCapacity">Production Capacity</Label>
                              <Input
                                id="productionCapacity"
                                placeholder="e.g. 500 kg/month"
                                value={formData.productionCapacity}
                                onChange={(e) => handleInputChange("productionCapacity", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="productCode">Product/Service Code</Label>
                              <Input
                                id="productCode"
                                placeholder="Optional"
                                value={formData.productCode}
                                onChange={(e) => handleInputChange("productCode", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="deliveryTime">Delivery Time</Label>
                              <Input
                                id="deliveryTime"
                                placeholder="e.g. 3-5 days"
                                value={formData.deliveryTime}
                                onChange={(e) => handleInputChange("deliveryTime", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="packagingDetails">Packaging Details</Label>
                            <Textarea
                              id="packagingDetails"
                              placeholder="Describe packaging type, material, etc."
                              value={formData.packagingDetails}
                              onChange={(e) => handleInputChange("packagingDetails", e.target.value)}
                              rows={3}
                              disabled={isLoading}
                            />
                          </div>
                          {/* Quantity, Validity, Origin, Negotiable kept for product creation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity Available</Label>
                              <Input
                                id="quantity"
                                type="number"
                                placeholder="e.g., 100"
                                value={formData.quantity}
                                onChange={(e) => handleInputChange("quantity", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="validity">Product Validity *</Label>
                              <Select value={formData.validity} onValueChange={(v) => handleInputChange("validity", v)} disabled={isLoading}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select validity" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1-day">1 Day</SelectItem>
                                  <SelectItem value="5-days">5 Days</SelectItem>
                                  <SelectItem value="10-days">10 Days</SelectItem>
                                  <SelectItem value="30-month">1 Month</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="origin">Origin / Source</Label>
                              <Input
                                id="origin"
                                placeholder="e.g., Punjab, India"
                                value={formData.origin}
                                onChange={(e) => handleInputChange("origin", e.target.value)}
                                disabled={isLoading}
                              />
                            </div>
                            <div className="flex items-center space-x-2 md:col-span-2">
                              <Checkbox
                                id="negotiable"
                                checked={formData.negotiable}
                                onCheckedChange={(c) => handleInputChange("negotiable", c as boolean)}
                                disabled={isLoading}
                              />
                              <Label htmlFor="negotiable" className="text-sm font-normal cursor-pointer">Price is negotiable</Label>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            disabled={isLoading}
                            onClick={() => setProductTab("basic")}
                          >
                            Back
                          </Button>
                          <Button type="submit" form="product-details-form" variant="hero" size="lg" className="bg-teal-600 hover:bg-teal-700 gap-2" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finish"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            )}

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FarmerRegister;
