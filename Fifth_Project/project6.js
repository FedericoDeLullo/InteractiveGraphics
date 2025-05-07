var raytraceFS = `
struct Ray {
	vec3 pos;
	vec3 dir;
};

struct Material {
	vec3  k_d;	// Diffuse coefficient
	vec3  k_s;	// Specular coefficient
	float n;	// Specular exponent
};

struct Sphere {
	vec3     center;
	float    radius;
	Material mtl;
};

struct Light {
	vec3 position;
	vec3 intensity;
};

struct HitInfo {
	float    t;
	vec3     position;
	vec3     normal;
	Material mtl;
};

uniform Sphere spheres[ NUM_SPHERES ];
uniform Light  lights [ NUM_LIGHTS  ];
uniform samplerCube envMap;
uniform int bounceLimit;

// Ray-sphere intersection test
bool IntersectRay( inout HitInfo hit, Ray ray ) {
	hit.t = 1e30;
	bool foundHit = false;

	for (int i = 0; i < NUM_SPHERES; ++i) {
		vec3 oc = ray.pos - spheres[i].center;
		vec3 d = ray.dir;

		float a = dot(d, d);
		float b = 2.0 * dot(d, oc);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;

		float discriminant = b*b - 4.0*a*c;

		if (discriminant >= 0.0) {
			float sqrtD = sqrt(discriminant);
			float t1 = (-b - sqrtD) / (2.0 * a);
			float t2 = (-b + sqrtD) / (2.0 * a);
			float t = (t1 > 0.0) ? t1 : ((t2 > 0.0) ? t2 : -1.0);

			if (t > 0.0 && t < hit.t) {
				hit.t = t;
				hit.position = ray.pos + t * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Checks if a point is in shadow relative to a light
bool InShadow(vec3 position, vec3 lightDir, float lightDist) {
	Ray shadowRay;
	shadowRay.pos = position + 0.001 * lightDir;  // Offset to prevent self-intersection
	shadowRay.dir = lightDir;

	HitInfo shadowHit;
	if (IntersectRay(shadowHit, shadowRay)) {
		return shadowHit.t < lightDist;
	}
	return false;
}

// Blinn-Phong shading model
vec3 Shade(Material mtl, vec3 position, vec3 normal, vec3 view) {
	vec3 color = vec3(0.0);

	for (int i = 0; i < NUM_LIGHTS; ++i) {
		vec3 lightDir = lights[i].position - position;
		float dist = length(lightDir);
		lightDir = normalize(lightDir);

		if (!InShadow(position, lightDir, dist)) {
			vec3 halfway = normalize(lightDir + view);
			float diff = max(dot(normal, lightDir), 0.0);
			float spec = pow(max(dot(normal, halfway), 0.0), mtl.n);

			vec3 diffuse  = mtl.k_d * diff * lights[i].intensity;
			vec3 specular = mtl.k_s * spec * lights[i].intensity;

			color += diffuse + specular;
		}
	}
	return color;
}

// Main ray tracing function
vec4 RayTracer(Ray ray) {
	HitInfo hit;
	if (IntersectRay(hit, ray)) {
		vec3 view = normalize(-ray.dir);
		vec3 clr = Shade(hit.mtl, hit.position, hit.normal, view);

		vec3 k_s = hit.mtl.k_s;

		for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
			if (bounce >= bounceLimit) break;
			if (k_s.r + k_s.g + k_s.b <= 0.0) break;

			Ray r;
			HitInfo h;

			// Reflection ray
			r.pos = hit.position + 0.001 * hit.normal;
			r.dir = reflect(ray.dir, hit.normal);

			if (IntersectRay(h, r)) {
				vec3 viewDir = normalize(-r.dir);
				vec3 reflColor = Shade(h.mtl, h.position, h.normal, viewDir);
				clr += k_s * reflColor;

				// Prepare for next bounce
				k_s *= h.mtl.k_s;
				hit = h;
				ray = r;
			} else {
				// Hit environment
				clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
				break;
			}
		}

		return vec4(clr, 1.0);
	} else {
		// No hit: return environment color
		return vec4(textureCube(envMap, ray.dir.xzy).rgb, 0.0);
	}
}
`;
