import React, { useEffect, useRef } from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from 'reactflow';
import gsap from 'gsap';

export const BeadsEdge: React.FC<EdgeProps> = ({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const beadRef = useRef<SVGCircleElement>(null);
    const pathRef = useRef<SVGPathElement>(null);

    useEffect(() => {
        if (!pathRef.current || !beadRef.current) return;

        // Kill any existing tweens to prevent memory leaks or conflicts
        gsap.killTweensOf(beadRef.current);

        // Create the motion path animation
        // Note: We use the raw path data string from getBezierPath
        // In a more complex setup, we might use MotionPathPlugin, but for simple flow,
        // we can animate the 'offset-distance' CSS property if supported, 
        // or use GSAP's MotionPathPlugin if we installed it.
        // simpler approach without MotionPathPlugin size overhead:
        // Animate a dummy object from 0 to 1 and update the bead position using getPointAtLength.

        const path = pathRef.current;
        const totalLength = path.getTotalLength();
        const dummy = { length: 0 };

        gsap.to(dummy, {
            length: totalLength,
            duration: 2,
            repeat: -1,
            ease: "none",
            onUpdate: () => {
                const point = path.getPointAtLength(dummy.length);
                if (beadRef.current) {
                    beadRef.current.setAttribute("cx", point.x.toString());
                    beadRef.current.setAttribute("cy", point.y.toString());
                }
            }
        });

        return () => {
            gsap.killTweensOf(dummy);
        };
    }, [edgePath]); // Re-run if path changes

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            <path ref={pathRef} d={edgePath} fill="none" className="opacity-0" />
            <circle ref={beadRef} r="4" fill="#60a5fa" className="pointer-events-none filter drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        </>
    );
};
