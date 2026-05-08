export const avatarOptions = [
  { id: "violet-smile", emoji: "🙂", gradient: "linear-gradient(135deg, #8b5cf6, #c084fc)" },
  { id: "sky-cool", emoji: "😎", gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)" },
  { id: "mint-happy", emoji: "😊", gradient: "linear-gradient(135deg, #10b981, #34d399)" },
  { id: "sunny-star", emoji: "🤩", gradient: "linear-gradient(135deg, #f59e0b, #fcd34d)" },
  { id: "rose-cheer", emoji: "😄", gradient: "linear-gradient(135deg, #ec4899, #f9a8d4)" },
  { id: "midnight-wave", emoji: "😌", gradient: "linear-gradient(135deg, #334155, #64748b)" },
];

export const getAvatarOption = (avatarId) => {
  return avatarOptions.find((option) => option.id === avatarId) || avatarOptions[0];
};
