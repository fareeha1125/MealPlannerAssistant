import React from "react";
import { Utensils, Carrot, Clock, ShoppingCart } from "lucide-react";

// Define the props interface
interface QuickStartCardsProps {
  onQuestionSelect: (question: string) => void;
}

// Define the question item interface
interface QuestionItem {
  icon: React.ReactNode;
  text: string;
  question: string;
}

const QuickStartCards: React.FC<QuickStartCardsProps> = ({
  onQuestionSelect,
}) => {
  const questions = [
    {
      icon: <Utensils className="w-5 h-5" />,
      text: "Personalized Meal Plan",
      question: "Can you create a meal plan for me? My dietary goals are [please specify your goals, e.g., weight loss, muscle gain, balanced nutrition].",
    },
    {
      icon: <Carrot className="w-5 h-5" />,
      text: "Dietary Restrictions",
      question: "I have specific dietary restrictions or preferences [mention allergies, vegan, keto, etc.]. Can you suggest meals that fit my needs?",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      text: "Meal Timing",
      question: "What’s the best meal timing for my lifestyle and fitness goals? I usually eat at [mention your typical meal schedule].",
    },
    {
      icon: <ShoppingCart className="w-5 h-5" />,
      text: "Grocery List",
      question: "Can you generate a grocery list based on my meal plan for the week?",
    },
  ];
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full p-4">
      {questions.map((item, index) => (
        <button
          key={index}
          onClick={() => onQuestionSelect(item.question)}
          className="bg-white dark:bg-black p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center space-y-3 border border-black/10 dark:border-white/10"
        >
          <div className="text-black dark:text-white">{item.icon}</div>
          <span className="text-sm text-black dark:text-white">
            {item.text}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickStartCards;
