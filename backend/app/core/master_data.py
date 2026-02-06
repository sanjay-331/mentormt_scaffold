from typing import Dict, List, Any

# Static Master Data Definition
# Mapped structure: Branch -> Departments -> Subjects

# 1. BRANCHES (Degree Programs)
BRANCHES = {
    "Engineering & Technology": [
        "B.Tech", "B.E", "B.Arch", "B.Plan", "BCA"
    ],
    "Science": [
        "B.Sc", "B.Sc (Hons)", "BS", "Integrated M.Sc"
    ],
    "Commerce": [
        "B.Com", "B.Com (Hons)", "BBA"
    ],
    "Arts & Humanities": [
        "BA", "BA (Hons)", "BFA", "BVA"
    ],
    "Medical & Health Sciences": [
        "MBBS", "BDS", "BAMS", "BHMS", "B.Pharm", "B.Sc Nursing", "BPT"
    ],
    "Law": [
        "LLB", "BA LLB", "BBA LLB"
    ],
    "Others": [
        "B.Ed", "BSW", "BHM"
    ]
}

# 2. DEPARTMENTS (Colleges/Faculties)
# Mapped by Branch Name (simplified for lookup)
# Note: For simplicity, we map specific degree types to their department lists.
# Some degrees share departments (e.g. B.Tech and B.E), so we can group them or duplicate.
DEPARTMENTS = {
    "B.Tech": [
        "Computer Science & Engineering", "Information Technology", "Artificial Intelligence & Machine Learning",
        "Data Science", "Electronics & Communication Engineering", "Electrical & Electronics Engineering",
        "Mechanical Engineering", "Civil Engineering", "Chemical Engineering", "Biotechnology Engineering",
        "Aerospace Engineering", "Agricultural Engineering", "Food Technology", "Robotics & Automation"
    ],
    "B.E": [
        "Computer Science & Engineering", "Information Technology", "Electronics & Communication Engineering",
        "Electrical & Electronics Engineering", "Mechanical Engineering", "Civil Engineering"
    ],
    "BCA": ["Computer Applications"],
    "B.Sc": [
        "Physics", "Chemistry", "Mathematics", "Statistics", "Botany", "Zoology",
        "Microbiology", "Biochemistry", "Biotechnology", "Environmental Science",
        "Geology", "Forensic Science", "Computer Science"
    ],
    "B.Com": [
        "Commerce", "Accounting & Finance", "Business Administration", "Marketing",
        "Human Resource Management", "Banking & Insurance", "Entrepreneurship"
    ],
    "BBA": ["Business Administration", "Marketing", "Finance", "HR"],
    "BA": [
        "English", "History", "Political Science", "Sociology", "Psychology",
        "Economics", "Geography", "Philosophy", "Languages", "Journalism & Mass Communication"
    ],
    "MBBS": ["General Medicine", "Surgery", "Pediatrics"], # Simplified
    "B.Pharm": ["Pharmacy"],
    "LLB": ["Law"],
    # Defaults for others to avoid empty dropdowns
    "DEFAULT": ["General"]
}

# 3. SUBJECTS (Branch + Department Wise)
# Key: (Branch, Department) -> List of Subjects
SUBJECTS = {
    # Engineering
    ("B.Tech", "Computer Science & Engineering"): [
        "Data Structures & Algorithms", "Object Oriented Programming", "Database Management Systems",
        "Computer Networks", "Operating Systems", "Software Engineering", "Web Technologies",
        "Artificial Intelligence", "Machine Learning", "Cloud Computing", "Cyber Security", "Internet of Things (IoT)"
    ],
    ("B.E", "Computer Science & Engineering"): [
         "Data Structures & Algorithms", "Object Oriented Programming", "Database Management Systems",
        "Computer Networks", "Operating Systems", "Software Engineering", "Web Technologies"
    ],
    ("B.Tech", "Electronics & Communication Engineering"): [
        "Digital Electronics", "Signals & Systems", "Communication Systems", "VLSI Design",
        "Embedded Systems", "Digital Signal Processing", "Microwave Engineering", "Antenna & Wave Propagation"
    ],
    ("B.Tech", "Mechanical Engineering"): [
        "Engineering Mechanics", "Thermodynamics", "Fluid Mechanics", "Machine Design",
        "Heat Transfer", "Manufacturing Technology", "CAD/CAM", "Robotics"
    ],
    ("B.Tech", "Civil Engineering"): [
        "Structural Analysis", "Concrete Technology", "Geotechnical Engineering",
        "Transportation Engineering", "Environmental Engineering", "Surveying",
        "Construction Management", "Fluid Mechanics"
    ],
    
    # Science
    ("B.Sc", "Physics"): [
        "Classical Mechanics", "Quantum Mechanics", "Electromagnetic Theory",
        "Thermodynamics & Statistical Physics", "Solid State Physics", "Nuclear Physics",
        "Astrophysics", "Computational Physics"
    ],
    ("B.Sc", "Chemistry"): [
        "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry",
        "Biochemistry", "Environmental Chemistry", "Pharmaceutical Chemistry", "Polymer Chemistry"
    ],
    ("B.Sc", "Mathematics"): [
        "Calculus", "Linear Algebra", "Differential Equations", "Real Analysis",
        "Complex Analysis", "Number Theory", "Discrete Mathematics", "Numerical Methods"
    ],
    ("B.Sc", "Biotechnology"): [
        "Molecular Biology", "Genetic Engineering", "Immunology", "Bioprocess Engineering",
        "Enzyme Technology", "Bioinformatics", "Medical Biotechnology", "Environmental Biotechnology"
    ],
    ("B.Sc", "Computer Science"): [
        "Programming in C/C++", "Java Programming", "Computer Organization", "Theory of Computation",
        "Computer Graphics", "Data Mining", "Mobile Application Development", "Network Security"
    ],

    # Commerce
    ("B.Com", "Commerce"): [
        "Financial Accounting", "Cost Accounting", "Business Law", "Income Tax",
        "Auditing", "Corporate Accounting", "Financial Management", "Business Mathematics"
    ],

    # Arts
    ("BA", "English"): [
        "British Literature", "American Literature", "Indian Writing in English",
        "Literary Criticism", "Linguistics", "Drama & Theatre", "Poetry", "Prose & Fiction"
    ],

    # Medical
    ("B.Pharm", "Pharmacy"): [
        "Pharmaceutics", "Pharmacology", "Pharmaceutical Chemistry", "Pharmacognosy",
        "Medicinal Chemistry", "Pharmaceutical Analysis", "Clinical Pharmacy", "Biopharmaceutics"
    ]
}

def get_branches():
    """Returns grouped branches."""
    return BRANCHES

def get_flat_branches():
    """Returns a flat list of all degrees (B.Tech, B.Sc, etc)."""
    flat = []
    for group in BRANCHES.values():
        flat.extend(group)
    return sorted(flat)

def get_departments(branch: str):
    """Returns departments for a specific branch (Degree)."""
    # Try direct match
    if branch in DEPARTMENTS:
        return DEPARTMENTS[branch]
    
    # Fallback/Default
    return DEPARTMENTS.get("DEFAULT", [])

def get_subjects(branch: str, department: str):
    """Returns subjects for a specific Branch + Department combo."""
    # Try exact match
    if (branch, department) in SUBJECTS:
        return SUBJECTS[(branch, department)]
    
    # Try fuzzy match or default
    # Return empty list if not found
    return []
