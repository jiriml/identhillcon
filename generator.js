
async function identhillconGenerator (text,canvas) {
    /*
     paints on html canvas based on the input
     */

    let ctx = canvas.getContext("2d");
    ctx.clearRect(0,0,canvas.width,canvas.height);

    async function hashSha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
    }
    let vecs = {
        normalize: function(vector) {
            let length = (vector[0]**2+vector[1]**2+vector[2]**2)**0.5;
            return [vector[0]/length,vector[1]/length,vector[2]/length]
        },
        multiply: function(vector,val) {
            return vector.map((a)=>{return a*val})
        },
        substract: function(vector1,vector2) {
            return [vector1[0]-vector2[0],vector1[1]-vector2[1],vector1[2]-vector2[2]]
        },
        dot_product: function(vector1,vector2) {
            let result = 0;
            for (let i = 0;i<=2;i++) {
                result = result + vector1[i]*vector2[i];
            }
            return result;
        },
        cross_product: function(vector1,vector2) {
            return [
                vector1[1] * vector2[2] - vector1[2] * vector2[1],
                vector1[2] * vector2[0] - vector1[0] * vector2[2],
                vector1[0] * vector2[1] - vector1[1] * vector2[0]
            ]
        }

    }
    let pseudogenerator = {
        val: 0,
        get: function() {this.val=(this.val+2)%3-1;return this.val}
    }

    let ourhash = await hashSha256(text);

    let colorsPalette= [[191,191,191],[236, 147,147],[147,236,147],[147,147,236], [140,140,140],[221,60,60],[60,221,60],[60,60,221], [64,64,64],[147,236,236],[236, 147, 236],[236,147,147], [38,38,38],[60, 221, 221],[221, 60, 221],[221,221,60]]
    let tmpP = parseInt(ourhash.slice(0,1),16);
    let colors = [colorsPalette[tmpP],colorsPalette[(tmpP+8)%16]];


    let heights = Array.from({length: 9}, () => Array.from({length: 9}, () => 0));

    for (let i=1; i<=8;i++) {
        let val = Math.floor(parseInt(ourhash.slice(Math.floor((i-1)/2+1),Math.floor((i-1)/2+1)+1),16)/(4**(i%2)))%4;
        val = (val==3)? pseudogenerator.get() : val - 1;
        heights[0][i] = heights[0][i-1] + val;
    }

    for (let y=1;y<=8;y++) {
        for (let x=0; x<=8; x++) {
            let i = y*9+x;
            let val = Math.floor(parseInt(ourhash.slice(Math.floor((i-1)/2),Math.floor((i-1)/2)+1),16)/(4**(i%2)))%4;
            val = (val==3)? pseudogenerator.get() : val - 1;


            let maxH = 16;
            let minH = - 16;
            for (let cx = -1;cx<=1;cx++) {
                if (cx + x <0 || cx + x > 8) { continue }
                maxH = Math.min(maxH,heights[y-1][cx+x]+Math.abs(cx)+1);
                minH = Math.max(minH,heights[y-1][cx+x]-Math.abs(cx)-1);
            }
            if (x>=1) {
                maxH = Math.min(maxH,heights[y][x-1]+1);
                minH = Math.max(minH,heights[y][x-1]-1);
            }
            heights[y][x] = Math.max(minH,Math.min(maxH,heights[y-1][x]+val))
        }
    }
    let medianFinder = heights.flat();
    medianFinder.sort((a,b)=>a-b);
    let medHeight = (medianFinder[39] + medianFinder[40])/2;

    for (let y = 0; y<=7; y++) {
        for (let x = 0; x<=7; x++) {
            let square = [heights[y][x],heights[y][x+1],heights[y+1][x+1],heights[y+1][x]]
            let divisiontype = 0;

            if (square[0] == square[2] && square[1] != square[3]) {
                divisiontype = 0;
            } else if (square[0] != square[2] && square[1] == square[3]) {
                divisiontype = 1;
            } else {
                if (square[0]+square[2]>=square[1]+square[3]) {
                    divisiontype = 0;
                } else  {
                    divisiontype = 1;
                }

            }

            for (let t = 0;t<=1;t++) {

                let brightness = 1;

                let pA = [divisiontype,0,square[divisiontype]]
                let pB = [1-divisiontype,1,square[divisiontype+2]]
                let pC = [(divisiontype+t+1)%2,t,square[2*t+1-divisiontype]]

                let u = vecs.substract(pB, pA);
                let v = vecs.substract(pC, pA);



                let planeNormal = vecs.normalize(vecs.cross_product(u,v));
                planeNormal = (planeNormal[2]>=0)? planeNormal : vecs.multiply(planeNormal,-1);


                let colorMode=0;
                if (Math.min(square[0+divisiontype],square[2+divisiontype],square[2*t+1-divisiontype])<medHeight) {
                    colorMode = 1
                }

                brightness = vecs.dot_product([0.5,-0.866,0],planeNormal)/2+0.5;


                let color = vecs.multiply(colors[colorMode],1 - (1-brightness)*(colorMode==0? 0.2: 0.075));

                ctx.fillStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
                ctx.strokeStyle = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

                ctx.lineWidth = 1;
                ctx.beginPath();
                let oy = 64*y;
                let ox = 64*x;
                ctx.moveTo(ox+64*divisiontype,oy);
                ctx.lineTo(ox+64*(1-divisiontype),oy+64);
                ctx.lineTo(ox+64*((divisiontype+t+1)%2),oy+64*t);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

        }

    }



}
