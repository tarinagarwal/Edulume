import Star from "./Star";
import { useState } from "react";

interface StarRatingProps {
    size?: "size-4" | "size-6" | "size-8"; // size-4 = small, size-6 = medium, size-8 = large
    readonly: boolean;
    rating: number;
    onRatingChange: (rating: number) => void;
}

const StarRating = ({ size = "size-6", readonly, rating, onRatingChange }: StarRatingProps) => {
    const [hoverRating, setHoverRating] = useState<number>(0);

    return (
        <div
            className="flex flex-row space-x-1"
            onMouseLeave={() => !readonly && setHoverRating(0)}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    filled={hoverRating ? star <= hoverRating : star <= rating}
                    extraClass={size}
                    readonly={readonly}
                    onMouseEnter={() => !readonly && setHoverRating(star)}
                    onClick={() => !readonly && onRatingChange(star)}
                />
            ))}
        </div>
    );
};

export default StarRating;
