// import { cn } from '@/lib/utils'

// export function Skeleton({ className }: { className?: string }) {
//   return <div className={cn('skeleton', className)} />
// }

// export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
//   return (
//     <div className="kanza-card overflow-hidden">
//       <div className="p-4 border-b border-border">
//         <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
//           {Array.from({ length: cols }).map((_, i) => (
//             <Skeleton key={i} className="h-3 w-20" />
//           ))}
//         </div>
//       </div>
//       {Array.from({ length: rows }).map((_, i) => (
//         <div key={i} className="p-4 border-b border-border last:border-0">
//           <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
//             {Array.from({ length: cols }).map((_, j) => (
//               <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-32' : 'w-20')} />
//             ))}
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }

// export function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
//   return (
//     <div className={cn('kanza-card flex items-end justify-around gap-2 p-6', height)}>
//       {Array.from({ length: 6 }).map((_, i) => (
//         <Skeleton
//           key={i}
//           className="flex-1 rounded-t-md"
//           style={{ height: `${30 + Math.random() * 60}%` }}
//         />
//       ))}
//     </div>
//   )
// }

// export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
//   return (
//     <div className={cn('grid gap-4', count === 4 ? 'grid-cols-2 lg:grid-cols-4' : count === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2')}>
//       {Array.from({ length: count }).map((_, i) => (
//         <div key={i} className="kanza-metric">
//           <Skeleton className="h-3 w-24 mb-3" />
//           <Skeleton className="h-7 w-36 mb-2" />
//           <Skeleton className="h-3 w-20" />
//         </div>
//       ))}
//     </div>
//   )
// }





import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="kanza-card overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border last:border-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className={cn('h-4', j === 0 ? 'w-32' : 'w-20')} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton({ height = 'h-48' }: { height?: string }) {
  const heights = [45, 70, 55, 85, 40, 65]
  return (
    <div className={cn('kanza-card flex items-end justify-around gap-2 p-6', height)}>
      {heights.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md bg-muted animate-pulse"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

export function MetricGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={cn('grid gap-4', count === 4 ? 'grid-cols-2 lg:grid-cols-4' : count === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="kanza-metric">
          <Skeleton className="h-3 w-24 mb-3" />
          <Skeleton className="h-7 w-36 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}