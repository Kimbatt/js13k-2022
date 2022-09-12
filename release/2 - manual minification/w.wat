(module
    (func $dot3 (param f32 f32 f32 f32 f32 f32) (result f32)
        ;; calculates the dot product of two 3d vectors
        local.get 0
        local.get 1
        f32.mul

        local.get 2
        local.get 3
        f32.mul

        local.get 4
        local.get 5
        f32.mul

        f32.add
        f32.add
    )

    (func $dot4 (param f32 f32 f32 f32 f32 f32 f32 f32) (result f32)
        ;; calculates the dot product of two 4d vectors
        local.get 0
        local.get 1
        f32.mul

        local.get 2
        local.get 3
        f32.mul

        local.get 4
        local.get 5
        f32.mul

        local.get 6
        local.get 7
        f32.mul

        f32.add
        f32.add
        f32.add
    )

    (func (export "m4m")
        (param $a0 f32) (param $a1 f32) (param $a2 f32) (param $a3 f32)
        (param $a4 f32) (param $a5 f32) (param $a6 f32) (param $a7 f32)
        (param $a8 f32) (param $a9 f32) (param $a10 f32) (param $a11 f32)
        (param $a12 f32) (param $a13 f32) (param $a14 f32) (param $a15 f32)

        (param $b0 f32) (param $b1 f32) (param $b2 f32) (param $b3 f32)
        (param $b4 f32) (param $b5 f32) (param $b6 f32) (param $b7 f32)
        (param $b8 f32) (param $b9 f32) (param $b10 f32) (param $b11 f32)
        (param $b12 f32) (param $b13 f32) (param $b14 f32) (param $b15 f32)

        (result f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32)

        ;; element 0
        local.get $a0
        local.get $b0

        local.get $a4
        local.get $b1

        local.get $a8
        local.get $b2

        local.get $a12
        local.get $b3

        call $dot4


        ;; element 1
        local.get $a1
        local.get $b0

        local.get $a5
        local.get $b1

        local.get $a9
        local.get $b2

        local.get $a13
        local.get $b3

        call $dot4


        ;; element 2
        local.get $a2
        local.get $b0

        local.get $a6
        local.get $b1

        local.get $a10
        local.get $b2

        local.get $a14
        local.get $b3

        call $dot4


        ;; element 3
        local.get $a3
        local.get $b0

        local.get $a7
        local.get $b1

        local.get $a11
        local.get $b2

        local.get $a15
        local.get $b3

        call $dot4

        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

        ;; element 4
        local.get $a0
        local.get $b4

        local.get $a4
        local.get $b5

        local.get $a8
        local.get $b6

        local.get $a12
        local.get $b7

        call $dot4


        ;; element 5
        local.get $a1
        local.get $b4

        local.get $a5
        local.get $b5

        local.get $a9
        local.get $b6

        local.get $a13
        local.get $b7

        call $dot4


        ;; element 6
        local.get $a2
        local.get $b4

        local.get $a6
        local.get $b5

        local.get $a10
        local.get $b6

        local.get $a14
        local.get $b7

        call $dot4


        ;; element 7
        local.get $a3
        local.get $b4

        local.get $a7
        local.get $b5

        local.get $a11
        local.get $b6

        local.get $a15
        local.get $b7

        call $dot4

        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

        ;; element 8
        local.get $a0
        local.get $b8

        local.get $a4
        local.get $b9

        local.get $a8
        local.get $b10

        local.get $a12
        local.get $b11

        call $dot4


        ;; element 9
        local.get $a1
        local.get $b8

        local.get $a5
        local.get $b9

        local.get $a9
        local.get $b10

        local.get $a13
        local.get $b11

        call $dot4


        ;; element 10
        local.get $a2
        local.get $b8

        local.get $a6
        local.get $b9

        local.get $a10
        local.get $b10

        local.get $a14
        local.get $b11

        call $dot4


        ;; element 11
        local.get $a3
        local.get $b8

        local.get $a7
        local.get $b9

        local.get $a11
        local.get $b10

        local.get $a15
        local.get $b11

        call $dot4

        ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

        ;; element 12
        local.get $a0
        local.get $b12

        local.get $a4
        local.get $b13

        local.get $a8
        local.get $b14

        local.get $a12
        local.get $b15

        call $dot4


        ;; element 13
        local.get $a1
        local.get $b12

        local.get $a5
        local.get $b13

        local.get $a9
        local.get $b14

        local.get $a13
        local.get $b15

        call $dot4


        ;; element 14
        local.get $a2
        local.get $b12

        local.get $a6
        local.get $b13

        local.get $a10
        local.get $b14

        local.get $a14
        local.get $b15

        call $dot4


        ;; element 15
        local.get $a3
        local.get $b12

        local.get $a7
        local.get $b13

        local.get $a11
        local.get $b14

        local.get $a15
        local.get $b15

        call $dot4
    )

;; TODO: is this needed? probably not
;; it's not finished, so if needed anyways, it should be finished
;;    (func (export "matrix4x4invert")
;;        (param $m11 f32) (param $m21 f32) (param $m31 f32) (param $m41 f32)
;;        (param $m12 f32) (param $m22 f32) (param $m32 f32) (param $m42 f32)
;;        (param $m13 f32) (param $m23 f32) (param $m33 f32) (param $m43 f32)
;;        (param $m14 f32) (param $m24 f32) (param $m34 f32) (param $m44 f32)
;;
;;        (result f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32)
;;
;;        (local $t1 f32)
;;        (local $t2 f32)
;;        (local $t3 f32)
;;        (local $t4 f32)
;;        (local $invDet f32)
;;
;;        ;; t1 = m23 * m34 * m42 - m24 * m33 * m42 + m24 * m32 * m43 - m22 * m34 * m43 - m23 * m32 * m44 + m22 * m33 * m44
;;        local.get $m23
;;        local.get $m34
;;        local.get $m42
;;        f32.mul
;;        f32.mul
;;
;;        local.get $m24
;;        local.get $m33
;;        local.get $m42
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m24
;;        local.get $m32
;;        local.get $m43
;;        f32.mul
;;        f32.mul
;;
;;        f32.add
;;
;;        local.get $m22
;;        local.get $m34
;;        local.get $m43
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m23
;;        local.get $m32
;;        local.get $m44
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m22
;;        local.get $m33
;;        local.get $m44
;;        f32.mul
;;        f32.mul
;;
;;        f32.add
;;
;;        ;; t2 = m14 * m33 * m42 - m13 * m34 * m42 - m14 * m32 * m43 + m12 * m34 * m43 + m13 * m32 * m44 - m12 * m33 * m44
;;        local.get $m14
;;        local.get $m33
;;        local.get $m42
;;        f32.mul
;;        f32.mul
;;
;;        local.get $m13
;;        local.get $m34
;;        local.get $m42
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m14
;;        local.get $m32
;;        local.get $m43
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m12
;;        local.get $m34
;;        local.get $m43
;;        f32.mul
;;        f32.mul
;;
;;        f32.add
;;
;;        local.get $m13
;;        local.get $m32
;;        local.get $m44
;;        f32.mul
;;        f32.mul
;;
;;        f32.add
;;
;;        local.get $m12
;;        local.get $m33
;;        local.get $m44
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        ;; t3 = m13 * m24 * m42 - m14 * m23 * m42 + m14 * m22 * m43 - m12 * m24 * m43 - m13 * m22 * m44 + m12 * m23 * m44
;;        local.get $m13
;;        local.get $m24
;;        local.get $m42
;;        f32.mul
;;        f32.mul
;;
;;        local.get $m14
;;        local.get $m23
;;        local.get $m42
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m14
;;        local.get $m22
;;        local.get $m43
;;        f32.mul
;;        f32.mul
;;
;;        f32.add
;;
;;        local.get $m12
;;        local.get $m24
;;        local.get $m43
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m13
;;        local.get $m22
;;        local.get $m44
;;        f32.mul
;;        f32.mul
;;
;;        f32.sub
;;
;;        local.get $m12
;;        local.get $m23
;;        local.get $m44
;;        f32.mul
;;        f32.mul
;;
;;        f32.add
;;    )

    (func (export "m4c")
        (param $px f32) (param $py f32) (param $pz f32)
        (param $qx f32) (param $qy f32) (param $qz f32) (param $qw f32)
        (param $sx f32) (param $sy f32) (param $sz f32)
        (result f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32 f32)

        (local $x2 f32)
        (local $y2 f32)
        (local $z2 f32)
        (local $xx f32)
        (local $xy f32)
        (local $xz f32)
        (local $yy f32)
        (local $yz f32)
        (local $zz f32)
        (local $wx f32)
        (local $wy f32)
        (local $wz f32)

        ;; x2 = q.x + q.x
        local.get $qx
        f32.const 2
        f32.mul
        local.set $x2

        ;; y2 = q.y + q.y
        local.get $qy
        f32.const 2
        f32.mul
        local.set $y2

        ;; z2 = q.z + q.z
        local.get $qz
        f32.const 2
        f32.mul
        local.set $z2

        ;; xx = q.x * x2
        local.get $qx
        local.get $x2
        f32.mul
        local.set $xx

        ;; xy = q.x * y2
        local.get $qx
        local.get $y2
        f32.mul
        local.set $xy

        ;; xz = q.x * z2
        local.get $qx
        local.get $z2
        f32.mul
        local.set $xz

        ;; yy = q.y * y2
        local.get $qy
        local.get $y2
        f32.mul
        local.set $yy

        ;; yz = q.y * z2
        local.get $qy
        local.get $z2
        f32.mul
        local.set $yz

        ;; zz = q.z * z2
        local.get $qz
        local.get $z2
        f32.mul
        local.set $zz

        ;; wx = q.w * x2
        local.get $qw
        local.get $x2
        f32.mul
        local.set $wx

        ;; wy = q.w * y2
        local.get $qw
        local.get $y2
        f32.mul
        local.set $wy

        ;; wz = q.w * z2
        local.get $qw
        local.get $z2
        f32.mul
        local.set $wz

        ;; result[0] = (1 - (yy + zz)) * s.x
        f32.const 1
        local.get $yy
        local.get $zz
        f32.add
        f32.sub
        local.get $sx
        f32.mul

        ;; result[1] = (xy + wz) * s.x
        local.get $xy
        local.get $wz
        f32.add
        local.get $sx
        f32.mul

        ;; result[2] = (xz - wy) * s.x
        local.get $xz
        local.get $wy
        f32.sub
        local.get $sx
        f32.mul

        ;; result[3] = 0
        f32.const 0

        ;; result[4] = (xy - wz) * s.y
        local.get $xy
        local.get $wz
        f32.sub
        local.get $sy
        f32.mul

        ;; result[5] = (1 - (xx + zz)) * s.y
        f32.const 1
        local.get $xx
        local.get $zz
        f32.add
        f32.sub
        local.get $sy
        f32.mul

        ;; result[6] = (yz + wx) * s.y
        local.get $yz
        local.get $wx
        f32.add
        local.get $sy
        f32.mul

        ;; result[7] = 0
        f32.const 0

        ;; result[8] = (xz + wy) * s.z
        local.get $xz
        local.get $wy
        f32.add
        local.get $sz
        f32.mul

        ;; result[9] = (yz - wx) * s.z
        local.get $yz
        local.get $wx
        f32.sub
        local.get $sz
        f32.mul

        ;; result[10] = (1 - (xx + yy)) * s.z
        f32.const 1
        local.get $xx
        local.get $yy
        f32.add
        f32.sub
        local.get $sz
        f32.mul

        ;; result[11] = 0
        f32.const 0

        ;; result[12] = p.x
        local.get $px

        ;; result[13] = p.y
        local.get $py

        ;; result[14] = p.z
        local.get $pz

        ;; result[15] = 1
        f32.const 1
    )

    (func $cross2d
        (param $a f32) (param $b f32) (param $c f32) (param $d f32)

        (result f32)

        ;; result = a * d - b * c

        local.get $a
        local.get $d
        f32.mul

        local.get $b
        local.get $c
        f32.mul

        f32.sub
    )

    (func (export "m3i")
        (param $m11 f32) (param $m21 f32) (param $m31 f32)
        (param $m12 f32) (param $m22 f32) (param $m32 f32)
        (param $m13 f32) (param $m23 f32) (param $m33 f32)

        (result f32 f32 f32 f32 f32 f32 f32 f32 f32)

        (local $t1 f32)
        (local $t2 f32)
        (local $t3 f32)
        (local $invDet f32)

        ;; t1 = m33 * m22 - m32 * m23
        local.get $m33
        local.get $m32
        local.get $m23
        local.get $m22
        call $cross2d
        local.set $t1

        ;; t2 = m32 * m13 - m33 * m12
        local.get $m32
        local.get $m33
        local.get $m12
        local.get $m13
        call $cross2d
        local.set $t2

        ;; t3 = m23 * m12 - m22 * m13
        local.get $m23
        local.get $m22
        local.get $m13
        local.get $m12
        call $cross2d
        local.set $t3

        ;; invDet = 1 / (m11 * t1 + m21 * t2 + m31 * t3)
        f32.const 1

        local.get $m11
        local.get $t1
        f32.mul

        local.get $m21
        local.get $t2
        f32.mul

        local.get $m31
        local.get $t3
        f32.mul

        f32.add
        f32.add

        f32.div

        local.tee $invDet

        ;; result[0] = invDet * t1
        ;; invDet already on the stack
        local.get $t1
        f32.mul

        ;; result[1] = invDet * (m31 * m23 - m33 * m21)
        local.get $invDet

        local.get $m31
        local.get $m33
        local.get $m21
        local.get $m23
        call $cross2d

        f32.mul

        ;; result[2] = invDet * (m32 * m21 - m31 * m22)
        local.get $invDet

        local.get $m32
        local.get $m31
        local.get $m22
        local.get $m21
        call $cross2d

        f32.mul

        ;; result[3] = invDet * t2
        local.get $invDet
        local.get $t2
        f32.mul

        ;; result[4] = invDet * (m33 * m11 - m31 * m13)
        local.get $invDet

        local.get $m33
        local.get $m31
        local.get $m13
        local.get $m11
        call $cross2d

        f32.mul

        ;; result[5] = invDet * (m31 * m12 - m32 * m11)
        local.get $invDet

        local.get $m31
        local.get $m32
        local.get $m11
        local.get $m12
        call $cross2d

        f32.mul

        ;; result[6] = invDet * t3
        local.get $invDet
        local.get $t3
        f32.mul

        ;; result[7] = invDet * (m21 * m13 - m23 * m11)
        local.get $invDet

        local.get $m21
        local.get $m23
        local.get $m11
        local.get $m13
        call $cross2d

        f32.mul

        ;; result[8] = invDet * (m22 * m11 - m21 * m12)
        local.get $invDet

        local.get $m22
        local.get $m21
        local.get $m12
        local.get $m11
        call $cross2d

        f32.mul
    )

    ;; unused
    ;; (func (export "m3m")
    ;;     (param $a11 f32) (param $a21 f32) (param $a31 f32)
    ;;     (param $a12 f32) (param $a22 f32) (param $a32 f32)
    ;;     (param $a13 f32) (param $a23 f32) (param $a33 f32)

    ;;     (param $b11 f32) (param $b21 f32) (param $b31 f32)
    ;;     (param $b12 f32) (param $b22 f32) (param $b32 f32)
    ;;     (param $b13 f32) (param $b23 f32) (param $b33 f32)

    ;;     (result f32 f32 f32 f32 f32 f32 f32 f32 f32)

    ;;     ;; result[0] = a11 * b11 + a12 * b21 + a13 * b31
    ;;     local.get $a11
    ;;     local.get $b11

    ;;     local.get $a12
    ;;     local.get $b21

    ;;     local.get $a13
    ;;     local.get $b31

    ;;     call $dot3

    ;;     ;; result[1] = a21 * b11 + a22 * b21 + a23 * b31
    ;;     local.get $a21
    ;;     local.get $b11

    ;;     local.get $a22
    ;;     local.get $b21

    ;;     local.get $a23
    ;;     local.get $b31

    ;;     call $dot3

    ;;     ;; result[2] = a31 * b11 + a32 * b21 + a33 * b31
    ;;     local.get $a31
    ;;     local.get $b11

    ;;     local.get $a32
    ;;     local.get $b21

    ;;     local.get $a33
    ;;     local.get $b31

    ;;     call $dot3

    ;;     ;; result[3] = a11 * b12 + a12 * b22 + a13 * b32
    ;;     local.get $a11
    ;;     local.get $b12

    ;;     local.get $a12
    ;;     local.get $b22

    ;;     local.get $a13
    ;;     local.get $b32

    ;;     call $dot3

    ;;     ;; result[4] = a21 * b12 + a22 * b22 + a23 * b32
    ;;     local.get $a21
    ;;     local.get $b12

    ;;     local.get $a22
    ;;     local.get $b22

    ;;     local.get $a23
    ;;     local.get $b32

    ;;     call $dot3

    ;;     ;; result[5] = a31 * b12 + a32 * b22 + a33 * b32
    ;;     local.get $a31
    ;;     local.get $b12

    ;;     local.get $a32
    ;;     local.get $b22

    ;;     local.get $a33
    ;;     local.get $b32

    ;;     call $dot3

    ;;     ;; result[6] = a11 * b13 + a12 * b23 + a13 * b33
    ;;     local.get $a11
    ;;     local.get $b13

    ;;     local.get $a12
    ;;     local.get $b23

    ;;     local.get $a13
    ;;     local.get $b33

    ;;     call $dot3

    ;;     ;; result[7] = a21 * b13 + a22 * b23 + a23 * b33
    ;;     local.get $a21
    ;;     local.get $b13

    ;;     local.get $a22
    ;;     local.get $b23

    ;;     local.get $a23
    ;;     local.get $b33

    ;;     call $dot3

    ;;     ;; result[8] = a31 * b13 + a32 * b23 + a33 * b33
    ;;     local.get $a31
    ;;     local.get $b13

    ;;     local.get $a32
    ;;     local.get $b23

    ;;     local.get $a33
    ;;     local.get $b33

    ;;     call $dot3
    ;; )

    ;; (func (export "qm")
    ;;     (param $ax f32) (param $ay f32) (param $az f32) (param $aw f32)
    ;;     (param $bx f32) (param $by f32) (param $bz f32) (param $bw f32)

    ;;     (result f32 f32 f32 f32)

    ;;     ;; result.x = ax * bw + aw * bx + ay * bz - az * by;
    ;;     local.get $ax
    ;;     local.get $bw
    ;;     local.get $aw
    ;;     local.get $bx
    ;;     local.get $ay
    ;;     local.get $bz
    ;;     call $dot3

    ;;     local.get $az
    ;;     local.get $by
    ;;     f32.mul
    ;;     f32.sub

    ;;     ;; result.y = ay * bw + aw * by + az * bx - ax * bz;
    ;;     local.get $ay
    ;;     local.get $bw
    ;;     local.get $aw
    ;;     local.get $by
    ;;     local.get $az
    ;;     local.get $bx
    ;;     call $dot3

    ;;     local.get $ax
    ;;     local.get $bz
    ;;     f32.mul
    ;;     f32.sub

    ;;     ;; result.z = az * bw + aw * bz + ax * by - ay * bx;
    ;;     local.get $az
    ;;     local.get $bw
    ;;     local.get $aw
    ;;     local.get $bz
    ;;     local.get $ax
    ;;     local.get $by
    ;;     call $dot3

    ;;     local.get $ay
    ;;     local.get $bx
    ;;     f32.mul
    ;;     f32.sub

    ;;     ;; result.w = aw * bw - ax * bx - ay * by - az * bz;
    ;;     ;;          = aw * bw - (ax * bx + ay * by + az * bz)
    ;;     local.get $aw
    ;;     local.get $bw
    ;;     f32.mul

    ;;     local.get $ax
    ;;     local.get $bx
    ;;     local.get $ay
    ;;     local.get $by
    ;;     local.get $az
    ;;     local.get $bz
    ;;     call $dot3

    ;;     f32.sub
    ;; )

    (func (export "pqm")
        (param $px f32) (param $py f32) (param $pz f32)
        (param $qx f32) (param $qy f32) (param $qz f32) (param $qw f32)

        (result f32 f32 f32)

        (local $ix f32)
        (local $iy f32)
        (local $iz f32)
        (local $iw f32)

        ;; ix = q.w * p.x + q.y * p.z - q.z * p.y
        local.get $qw
        local.get $px
        f32.mul

        local.get $qy
        local.get $pz
        f32.mul

        f32.add

        local.get $qz
        local.get $py
        f32.mul

        f32.sub

        local.set $ix

        ;; iy = q.w * p.y + q.z * p.x - q.x * p.z
        local.get $qw
        local.get $py
        f32.mul

        local.get $qz
        local.get $px
        f32.mul

        f32.add

        local.get $qx
        local.get $pz
        f32.mul

        f32.sub

        local.set $iy

        ;; iz = q.w * p.z + q.x * p.y - q.y * p.x
        local.get $qw
        local.get $pz
        f32.mul

        local.get $qx
        local.get $py
        f32.mul

        f32.add

        local.get $qy
        local.get $px
        f32.mul

        f32.sub

        local.set $iz

        ;; iw = -q.x * p.x - q.y * p.y - q.z * p.z
        ;; calculated by adding them all then negating at the end
        local.get $qx
        local.get $px
        f32.mul

        local.get $qy
        local.get $py
        f32.mul

        f32.add

        local.get $qz
        local.get $pz
        f32.mul

        f32.add

        f32.neg
        local.set $iw

        ;; result.x = ix * q.w - iw * q.x - iy * q.z + iz * q.y
        local.get $ix
        local.get $qw
        f32.mul

        local.get $iw
        local.get $qx
        f32.mul

        f32.sub

        local.get $iy
        local.get $qz
        f32.mul

        f32.sub

        local.get $iz
        local.get $qy
        f32.mul

        f32.add

        ;; result.y = iy * q.w - iw * q.y - iz * q.x + ix * q.z
        local.get $iy
        local.get $qw
        f32.mul

        local.get $iw
        local.get $qy
        f32.mul

        f32.sub

        local.get $iz
        local.get $qx
        f32.mul

        f32.sub

        local.get $ix
        local.get $qz
        f32.mul

        f32.add

        ;; result.z = iz * q.w - iw * q.z - ix * q.y + iy * q.x
        local.get $iz
        local.get $qw
        f32.mul

        local.get $iw
        local.get $qz
        f32.mul

        f32.sub

        local.get $ix
        local.get $qy
        f32.mul

        f32.sub

        local.get $iy
        local.get $qx
        f32.mul

        f32.add
    )
)
