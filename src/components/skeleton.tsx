'use client'
import { FC } from "react";
import '@/css/skeleton.css'
type TDirection = 'vert' | 'hr' | 'rotate'

const Skeleton: FC<{ direction?: TDirection }> = ({ direction = 'vert' }) => {
  return (
    <div className="skeleton">
      <div className={`skeleton-in ${direction}`}></div>
    </div>
  )
}
export default Skeleton;