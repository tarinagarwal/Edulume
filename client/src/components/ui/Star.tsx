import { Star as StarIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StarProps {
    filled: boolean
    extraClass?: string
    readonly: boolean
    onMouseEnter?: () => void
    onClick?: () => void
}

const Star = ({ filled, extraClass, readonly, onMouseEnter, onClick }: StarProps) => {

    return (
        <StarIcon
            className={cn(
                "transition-colors duration-150",
                filled ? "fill-current text-yellow-500" : "text-gray-300",
                !readonly ? cn("cursor-pointer hover:scale-110 transition-transform", extraClass) : extraClass
            )}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
        />
    )
}

export default Star
