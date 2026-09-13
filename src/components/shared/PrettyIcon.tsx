import React from "react";
import {
  Heart,
  Mail,
  Cookie,
  HandHeart,
  Film,
  GlassWater,
  Bike,
  Crown,
  Flower2,
  Sparkles,
  Gift,
  Coins,
  Package,
  Star,
  Music,
  Camera,
  BookOpen,
  PartyPopper,
  Coffee,
  Utensils,
  Footprints,
  Flame,
  Trophy,
  Clock,
  CheckCircle2,
  Salad,
} from "lucide-react";

interface PrettyIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function PrettyIcon({ name, className = "w-5 h-5 text-romantic-500", size }: PrettyIconProps) {
  const sizeProp = size ? { size } : {};
  switch (name) {
    case "coffee":
    case "☕":
      return <Coffee className={`${className} text-amber-800`} {...sizeProp} />;
    case "utensils":
    case "fork":
    case "food":
    case "dinner":
    case "🥗":
      return <Utensils className={`${className} text-emerald-600`} {...sizeProp} />;
    case "walk":
    case "footprints":
    case "👟":
      return <Footprints className={`${className} text-blue-500`} {...sizeProp} />;
    case "flame":
    case "fire":
    case "🔥":
      return <Flame className={`${className} text-orange-500`} {...sizeProp} />;
    case "trophy":
    case "award":
    case "🏆":
      return <Trophy className={`${className} text-amber-500`} {...sizeProp} />;
    case "❤️":
    case "heart":
    case "love":
      return <Heart className={`${className} fill-romantic-100 text-romantic-500`} />;
    case "💌":
    case "mail":
    case "message":
      return <Mail className={`${className} text-rose-500`} />;
    case "🍫":
    case "snack":
    case "cookie":
      return <Cookie className={`${className} text-amber-700`} />;
    case "🫶":
    case "hands":
    case "attention":
      return <HandHeart className={`${className} text-romantic-500`} />;
    case "🎬":
    case "movie":
    case "film":
      return <Film className={`${className} text-indigo-500`} />;
    case "🍹":
    case "drink":
    case "food":
      return <GlassWater className={`${className} text-cyan-600`} />;
    case "🚲":
    case "bike":
      return <Bike className={`${className} text-emerald-600`} />;
    case "👑":
    case "crown":
    case "princess":
      return <Crown className={`${className} text-amber-500 fill-amber-100`} />;
    case "🌹":
    case "rose":
    case "flower":
    case "date":
      return <Flower2 className={`${className} text-rose-600`} />;
    case "✨":
    case "sparkles":
    case "rules":
      return <Sparkles className={`${className} text-amber-500`} />;
    case "🎁":
    case "gift":
      return <Gift className={`${className} text-romantic-500`} />;
    case "🪙":
    case "coin":
    case "coins":
      return <Coins className={`${className} text-amber-500`} />;
    case "📦":
    case "package":
    case "box":
      return <Package className={`${className} text-stone-600`} />;
    case "⭐":
    case "star":
      return <Star className={`${className} text-amber-400 fill-amber-100`} />;
    case "🎵":
    case "music":
      return <Music className={`${className} text-purple-500`} />;
    case "📷":
    case "camera":
      return <Camera className={`${className} text-teal-600`} />;
    case "📖":
    case "book":
      return <BookOpen className={`${className} text-blue-500`} />;
    case "🎉":
    case "party":
      return <PartyPopper className={`${className} text-amber-500`} />;
    default:
      return <Sparkles className={`${className} text-romantic-500`} />;
  }
}
