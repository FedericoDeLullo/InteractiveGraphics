var raytraceFS = `
struct Ray {
	vec3 pos;  // Ray origin
	vec3 dir;  // Ray direction
};

struct Material {
	vec3  k_d; // Diffuse reflection coefficient
	vec3  k_s; // Specular reflection coefficient
	float n;   // Specular exponent (shininess)
};

struct Sphere {
	vec3     center;  // Center of the sphere
	float    radius;  // Radius of the sphere
	Material mtl;     // Material of the sphere
};

struct Light {
	vec3 position;   // Position of the point light
	vec3 intensity;  // Intensity/color of the light
};

struct HitInfo {
	float    t;        // Distance to intersection
	vec3     position; // Point of intersection
	vec3     normal;   // Surface normal at intersection
	Material mtl;      // Material at intersection
};

uniform Sphere spheres[ NUM_SPHERES ]; // Array of scene spheres
uniform Light  lights [ NUM_LIGHTS  ]; // Array of lights
uniform samplerCube envMap;            // Environment map for background/reflections
uniform int bounceLimit;               // Maximum number of reflection bounces

// Ray-sphere intersection test
bool IntersectRay(inout HitInfo hit, Ray ray) {
	hit.t = 1e30;         // Initialize hit distance to a large number
	bool foundHit = false;

	for (int i = 0; i < NUM_SPHERES; ++i) {
		vec3 oc = ray.pos - spheres[i].center;
		vec3 d = ray.dir;

		float a = dot(d, d);
		float b = 2.0 * dot(d, oc);
		float c = dot(oc, oc) - spheres[i].radius * spheres[i].radius;

		float discriminant = b * b - 4.0 * a * c;

		if (discriminant >= 0.0) {
			float sqrtD = sqrt(discriminant);
			float t1 = (-b - sqrtD) / (2.0 * a); // Closest intersection

			if (t1 > 0.0 && t1 < hit.t) {
				hit.t = t1;
				hit.position = ray.pos + t1 * ray.dir;
				hit.normal = normalize(hit.position - spheres[i].center);
				hit.mtl = spheres[i].mtl;
				foundHit = true;
			}
		}
	}
	return foundHit;
}

// Determines if a point is in shadow with respect to a light
bool InShadow(vec3 position, vec3 lightDir, float lightDist) {
	Ray shadowRay;
	shadowRay.pos = position + 0.001 * lightDir; // Offset to avoid self-shadowing
	shadowRay.dir = lightDir;

	HitInfo shadowHit;
	if (IntersectRay(shadowHit, shadowRay)) {
		return shadowHit.t < lightDist; // If hit something before the light, it's in shadow
	}
	return false;
}

// Blinn-Phong shading model to compute local illumination
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

		vec3 k_s = hit.mtl.k_s; // Initial specular coefficient

		// Reflection bounces
		for (int bounce = 0; bounce < MAX_BOUNCES; ++bounce) {
			if (bounce >= bounceLimit) break; // Stop at bounce limit
			if (k_s.r + k_s.g + k_s.b <= 0.0) break; // No more reflective component

			Ray r;
			HitInfo h;

			// Compute reflected ray
			r.pos = hit.position + 0.001 * hit.normal; // Offset to avoid acne
			r.dir = reflect(ray.dir, hit.normal);

			if (IntersectRay(h, r)) {
				vec3 viewDir = normalize(-r.dir);
				vec3 reflColor = Shade(h.mtl, h.position, h.normal, viewDir);
				clr += k_s * reflColor;

				// Update for next bounce
				k_s *= h.mtl.k_s;
				hit = h;
				ray = r;
			} else {
				// Ray escapes the scene: sample environment map
				clr += k_s * textureCube(envMap, r.dir.xzy).rgb;
				break;
			}
		}

		return vec4(clr, 1.0); // Return final color with full opacity
	} else {
		// No intersection: return background/environment color
		return vec4(textureCube(envMap, ray.dir.xzy).rgb, 0.0);
	}
}
`;
