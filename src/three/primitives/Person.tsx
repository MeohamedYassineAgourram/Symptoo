import { forwardRef } from 'react';
import type { Group } from 'three';
import { clay } from '../materials';
import { bodyGeometry, hairGeometry, headGeometry, hijabGeometry } from './geometries';

export interface PersonLook {
  outfit: string;
  skin: string;
  hair: string;
  hijab?: boolean;
}

/** A single chibi character (for the few that move individually; crowds use <Crowd>). */
export const Person = forwardRef<Group, PersonLook & { position?: [number, number, number]; rotationY?: number; scale?: number }>(
  function Person({ outfit, skin, hair, hijab, position = [0, 0, 0], rotationY = 0, scale = 1 }, ref) {
    return (
      <group ref={ref} position={position} rotation-y={rotationY} scale={scale}>
        <mesh geometry={bodyGeometry()} material={clay(outfit)} castShadow />
        <mesh geometry={headGeometry()} material={clay(skin)} castShadow />
        {hijab ? (
          <mesh geometry={hijabGeometry()} material={clay(hair)} castShadow />
        ) : (
          <mesh geometry={hairGeometry()} material={clay(hair)} />
        )}
      </group>
    );
  },
);
