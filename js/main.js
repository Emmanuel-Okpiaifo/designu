// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Use smooth scrolling with fallback for iOS
            if ('scrollBehavior' in document.documentElement.style) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // Fallback for iOS Safari
                const targetPosition = target.offsetTop;
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                const duration = 1000;
                let start = null;
                
                function animation(currentTime) {
                    if (start === null) start = currentTime;
                    const timeElapsed = currentTime - start;
                    const run = ease(timeElapsed, startPosition, distance, duration);
                    window.scrollTo(0, run);
                    if (timeElapsed < duration) requestAnimationFrame(animation);
                }
                
                function ease(t, b, c, d) {
                    t /= d / 2;
                    if (t < 1) return c / 2 * t * t + b;
                    t--;
                    return -c / 2 * (t * (t - 2) - 1) + b;
                }
                
                requestAnimationFrame(animation);
            }
        }
    });
});

// Add scroll event listener for header
const header = document.querySelector('.header');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }
    
    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        // Scroll Down
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        // Scroll Up
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});

// Add animation on scroll for feature cards
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    observer.observe(card);
});



// Global variables for blog pagination
let allBlogPosts = [];
let currentBlogIndex = 0;
const postsPerLoad = 6;

// Blog content fetching function
async function fetchBlogPosts() {
    const blogGrid = document.querySelector('.blog-grid');
    const loadingElement = document.getElementById('blog-loading');
    
    if (!blogGrid) {
        console.error('Blog grid element not found');
        return;
    }
    
    console.log('Starting to fetch blog posts...');
    
    try {
        // Show loading state
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // Try multiple approaches to get blog posts
        let posts = [];
        
        // Method 1: Try to get posts by category ID (more reliable)
        console.log('Method 1: Trying to fetch posts by category...');
        try {
            // First get the category ID for "Articles"
            const categoriesResponse = await fetch('https://designu.io/wp-json/wp/v2/categories?search=Articles');
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
                
                const articlesCategory = categories.find(cat => 
                    cat.name === 'Articles' || cat.slug === 'articles'
                );
                
                if (articlesCategory) {
                    console.log(`Found Articles category with ID: ${articlesCategory.id}`);
                    const categoryPostsResponse = await fetch(`https://designu.io/wp-json/wp/v2/posts?categories=${articlesCategory.id}&per_page=100&_embed`);
                    if (categoryPostsResponse.ok) {
                        posts = await categoryPostsResponse.json();
                        console.log(`Found ${posts.length} posts in Articles category`);
                    }
                }
            }
        } catch (error) {
            console.log('Method 1 failed:', error.message);
        }
        
        // Method 2: Get all posts and filter by category name
        if (posts.length === 0) {
            console.log('Method 2: Fetching all posts and filtering...');
            try {
                const response = await fetch('https://designu.io/wp-json/wp/v2/posts?per_page=100&_embed');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const allPosts = await response.json();
                console.log(`Fetched ${allPosts.length} total posts from API`);
                
                // Filter posts that contain "Articles" in their categories or content
                posts = allPosts.filter(post => {
                    // Check if post has categories
                    if (post._embedded && post._embedded['wp:term']) {
                        const categories = post._embedded['wp:term'][0] || [];
                        const hasArticlesCategory = categories.some(cat => 
                            cat.name === 'Articles' || 
                            cat.slug === 'articles'
                        );
                        if (hasArticlesCategory) {
                            console.log(`Found post with Articles category: ${post.title.rendered}`);
                        }
                        return hasArticlesCategory;
                    }
                    // Fallback: check if post content or title suggests it's an article
                    const content = (post.content?.rendered || '').toLowerCase();
                    const title = (post.title?.rendered || '').toLowerCase();
                    return content.includes('article') || title.includes('blog') || title.includes('post');
                });
                console.log(`Filtered to ${posts.length} posts`);
            } catch (error) {
                console.log('Method 2 failed:', error.message);
            }
        }
        
        // Method 3: Try getting posts by specific IDs
        if (posts.length === 0) {
            console.log('Method 3: Trying specific post IDs...');
            const postIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // More WordPress post IDs
            const postPromises = postIds.map(id => 
                fetch(`https://designu.io/wp-json/wp/v2/posts/${id}?_embed`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null)
            );
            
            const postResults = await Promise.all(postPromises);
            posts = postResults.filter(post => post !== null);
            console.log(`Found ${posts.length} posts by ID`);
        }
        
        // Method 4: Show static content as fallback
        if (posts.length === 0) {
            console.log('Method 4: Using static fallback content');
            loadStaticBlogContent();
            return;
        }
        
        // Store all posts globally and reset index
        allBlogPosts = posts;
        currentBlogIndex = 0;
        
        // Hide loading state
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Clear existing content
        blogGrid.innerHTML = '';
        
        // Display first 6 posts
        displayBlogPosts();
        
    } catch (error) {
        console.error('Error fetching blog posts:', error);
        
        // Hide loading state
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Show error state
        blogGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Blog Posts</h3>
                <p>We're experiencing technical difficulties. Please try again later or visit our main blog.</p>
                <a href="https://designu.io/blog/" class="btn-primary" target="_blank">Visit Our Blog</a>
            </div>
        `;
    }
}

// Function to display blog posts with pagination
function displayBlogPosts() {
    const blogGrid = document.querySelector('.blog-grid');
    if (!blogGrid) return;
    
    // Get posts to display
    const postsToShow = allBlogPosts.slice(currentBlogIndex, currentBlogIndex + postsPerLoad);
    
    // Add posts to grid
    postsToShow.forEach(post => {
        const postElement = createBlogPostElement(post);
        blogGrid.appendChild(postElement);
    });
    
    // Update index
    currentBlogIndex += postsPerLoad;
    
    // Show/hide load more button
    updateLoadMoreButton();
}

// Function to update load more button
function updateLoadMoreButton() {
    let loadMoreButton = document.getElementById('load-more-blog');
    
    // Create button if it doesn't exist
    if (!loadMoreButton) {
        loadMoreButton = document.createElement('button');
        loadMoreButton.id = 'load-more-blog';
        loadMoreButton.className = 'btn-primary load-more-btn';
        loadMoreButton.innerHTML = '<i class="fas fa-plus"></i> Load More Posts';
        loadMoreButton.addEventListener('click', loadMoreBlogPosts);
        
        // Add button after the blog grid
        const blogGrid = document.querySelector('.blog-grid');
        if (blogGrid && blogGrid.parentNode) {
            blogGrid.parentNode.appendChild(loadMoreButton);
        }
    }
    
    // Show/hide button based on remaining posts
    if (currentBlogIndex >= allBlogPosts.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
        loadMoreButton.innerHTML = `<i class="fas fa-plus"></i> Load More Posts (${allBlogPosts.length - currentBlogIndex} remaining)`;
    }
}

// Function to load more blog posts
function loadMoreBlogPosts() {
    displayBlogPosts();
}

// Global variables for opportunities pagination
let allOpportunities = [];
let currentOpportunitiesIndex = 0;
const opportunitiesPerLoad = 6;

// Function to display opportunities with pagination
function displayOpportunities() {
    const opportunitiesGrid = document.querySelector('.opportunities-grid');
    if (!opportunitiesGrid) return;
    
    // Get opportunities to display
    const opportunitiesToShow = allOpportunities.slice(currentOpportunitiesIndex, currentOpportunitiesIndex + opportunitiesPerLoad);
    
    // Add opportunities to grid
    opportunitiesToShow.forEach(opportunity => {
        const opportunityElement = createOpportunityElement(opportunity);
        opportunitiesGrid.appendChild(opportunityElement);
    });
    
    // Update index
    currentOpportunitiesIndex += opportunitiesPerLoad;
    
    // Show/hide load more button
    updateLoadMoreOpportunitiesButton();
}

// Function to update load more opportunities button
function updateLoadMoreOpportunitiesButton() {
    let loadMoreButton = document.getElementById('load-more-opportunities');
    
    // Create button if it doesn't exist
    if (!loadMoreButton) {
        loadMoreButton = document.createElement('button');
        loadMoreButton.id = 'load-more-opportunities';
        loadMoreButton.className = 'btn-primary load-more-btn';
        loadMoreButton.innerHTML = '<i class="fas fa-plus"></i> Load More Opportunities';
        loadMoreButton.addEventListener('click', loadMoreOpportunities);
        
        // Add button after the opportunities grid
        const opportunitiesGrid = document.querySelector('.opportunities-grid');
        if (opportunitiesGrid && opportunitiesGrid.parentNode) {
            opportunitiesGrid.parentNode.appendChild(loadMoreButton);
        }
    }
    
    // Show/hide button based on remaining opportunities
    if (currentOpportunitiesIndex >= allOpportunities.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'block';
        loadMoreButton.innerHTML = `<i class="fas fa-plus"></i> Load More Opportunities (${allOpportunities.length - currentOpportunitiesIndex} remaining)`;
    }
}

// Function to load more opportunities
function loadMoreOpportunities() {
    displayOpportunities();
}

// Create blog post element
function createBlogPostElement(post) {
    const article = document.createElement('article');
    article.className = 'blog-post';
    
    const featuredImage = post._embedded?.['wp:featuredmedia']?.[0]?.source_url || 'img/300-x-100-icon-1.png';
    const excerpt = post.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
    const date = new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    article.innerHTML = `
        <div class="blog-image">
            <img src="${featuredImage}" alt="${post.title.rendered}" onerror="this.src='img/300-x-100-icon-1.png'">
        </div>
        <div class="blog-text">
            <h2>${post.title.rendered}</h2>
            <p class="blog-meta">By DesignU Team | ${date}</p>
            <p>${excerpt}</p>
            <a href="${post.link}" class="read-more" target="_blank">Read More</a>
        </div>
    `;
    
    return article;
}

// Opportunities content fetching function
async function fetchOpportunities() {
    const opportunitiesGrid = document.querySelector('.opportunities-grid');
    const loadingElement = document.getElementById('opportunities-loading');
    
    if (!opportunitiesGrid) return;
    
    try {
        // Show loading state
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
        
        // Try multiple approaches to get opportunities
        let opportunities = [];
        
        // Method 1: Try to get posts by category ID for Opportunities
        console.log('Method 1: Trying to fetch opportunities by category...');
        try {
            // First get the category ID for "Opportunities"
            const categoriesResponse = await fetch('https://designu.io/wp-json/wp/v2/categories?search=Opportunities');
            if (categoriesResponse.ok) {
                const categories = await categoriesResponse.json();
                console.log('Available categories:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
                
                const opportunitiesCategory = categories.find(cat => 
                    cat.name === 'Opportunities' || cat.slug === 'opportunities'
                );
                
                if (opportunitiesCategory) {
                    console.log(`Found Opportunities category with ID: ${opportunitiesCategory.id}`);
                    const categoryPostsResponse = await fetch(`https://designu.io/wp-json/wp/v2/posts?categories=${opportunitiesCategory.id}&per_page=100&_embed`);
                    if (categoryPostsResponse.ok) {
                        opportunities = await categoryPostsResponse.json();
                        console.log(`Found ${opportunities.length} opportunities in Opportunities category`);
                    }
                }
            }
        } catch (error) {
            console.log('Method 1 failed:', error.message);
        }
        
        // Method 2: Get all posts and filter by category name
        if (opportunities.length === 0) {
            console.log('Method 2: Fetching all posts and filtering for opportunities...');
            try {
                const response = await fetch('https://designu.io/wp-json/wp/v2/posts?per_page=100&_embed');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const allPosts = await response.json();
                console.log(`Fetched ${allPosts.length} total posts from API`);
                
                // Filter posts that contain "Opportunities" in their categories or content
                opportunities = allPosts.filter(post => {
                    // Check if post has categories
                    if (post._embedded && post._embedded['wp:term']) {
                        const categories = post._embedded['wp:term'][0] || [];
                        const hasOpportunitiesCategory = categories.some(cat => 
                            cat.name === 'Opportunities' || 
                            cat.slug === 'opportunities'
                        );
                        if (hasOpportunitiesCategory) {
                            console.log(`Found post with Opportunities category: ${post.title.rendered}`);
                        }
                        return hasOpportunitiesCategory;
                    }
                    // Fallback: check if post content or title suggests it's an opportunity
                    const content = (post.content?.rendered || '').toLowerCase();
                    const title = (post.title?.rendered || '').toLowerCase();
                    return content.includes('opportunity') || 
                           content.includes('job') || 
                           content.includes('position') ||
                           content.includes('hiring') ||
                           title.includes('job') ||
                           title.includes('position') ||
                           title.includes('hiring');
                });
                console.log(`Filtered to ${opportunities.length} opportunities`);
            } catch (error) {
                console.log('Method 2 failed:', error.message);
            }
        }
        
        // Method 3: Try getting posts by specific IDs
        if (opportunities.length === 0) {
            console.log('Method 3: Trying specific post IDs for opportunities...');
            const postIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]; // More IDs for opportunities
            const postPromises = postIds.map(id => 
                fetch(`https://designu.io/wp-json/wp/v2/posts/${id}?_embed`)
                    .then(res => res.ok ? res.json() : null)
                    .catch(() => null)
            );
            
            const postResults = await Promise.all(postPromises);
            opportunities = postResults.filter(post => post !== null);
            console.log(`Found ${opportunities.length} opportunities by ID`);
        }
        
        // Method 4: Show static content as fallback
        if (opportunities.length === 0) {
            console.log('Method 4: Using static fallback content');
            loadStaticOpportunitiesContent();
            return;
        }
        
        // Store all opportunities globally and reset index
        allOpportunities = opportunities;
        currentOpportunitiesIndex = 0;
        
        // Hide loading state
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Clear existing content
        opportunitiesGrid.innerHTML = '';
        
        // Display first 6 opportunities
        displayOpportunities();
        
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        
        // Hide loading state
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // Show error state
        opportunitiesGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Load Opportunities</h3>
                <p>We're experiencing technical difficulties. Please try again later or visit our main opportunities page.</p>
                <a href="https://designu.io/opportunities/" class="btn-primary" target="_blank">Visit Opportunities Page</a>
            </div>
        `;
    }
}

// Create opportunity element
function createOpportunityElement(opportunity) {
    const card = document.createElement('div');
    card.className = 'opportunity-card';
    
    // Extract job details from content
    const content = opportunity.content.rendered;
    const title = opportunity.title.rendered;
    
    // Try to extract job details from content using regex
    const companyMatch = content.match(/company[:\s]+([^<]+)/i) || content.match(/employer[:\s]+([^<]+)/i);
    const locationMatch = content.match(/location[:\s]+([^<]+)/i) || content.match(/city[:\s]+([^<]+)/i);
    const salaryMatch = content.match(/salary[:\s]+([^<]+)/i) || content.match(/pay[:\s]+([^<]+)/i);
    
    const company = companyMatch ? companyMatch[1].trim() : 'DesignU Partner';
    const location = locationMatch ? locationMatch[1].trim() : 'Lagos, Nigeria';
    const salary = salaryMatch ? salaryMatch[1].trim() : 'Competitive';
    
    // Determine icon based on title
    const iconMap = {
        'design': 'fas fa-palette',
        'marketing': 'fas fa-chart-line',
        'developer': 'fas fa-laptop-code',
        'content': 'fas fa-pen-fancy',
        'social': 'fas fa-share-alt',
        'manager': 'fas fa-user-tie',
        'analyst': 'fas fa-chart-bar',
        'default': 'fas fa-briefcase'
    };
    
    let icon = 'fas fa-briefcase';
    for (const [key, iconClass] of Object.entries(iconMap)) {
        if (title.toLowerCase().includes(key)) {
            icon = iconClass;
            break;
        }
    }
    
    const excerpt = opportunity.excerpt.rendered.replace(/<[^>]*>/g, '').substring(0, 100) + '...';
    
    card.innerHTML = `
        <div class="opportunity-icon">
            <i class="${icon}"></i>
        </div>
        <h3>${title}</h3>
        <p class="company">${company}</p>
        <p class="location"><i class="fas fa-map-marker-alt"></i> ${location}</p>
        <p class="salary">${salary}</p>
        <p class="description">${excerpt}</p>
        <a href="${opportunity.link}" class="btn-primary" target="_blank">Apply Now</a>
    `;
    
    return card;
}

// Fallback static content for blog
function loadStaticBlogContent() {
    const blogGrid = document.querySelector('.blog-grid');
    if (blogGrid) {
        blogGrid.innerHTML = `
            <article class="blog-post">
                <div class="blog-image">
                    <img src="img/300-x-100-icon-1.png" alt="Blog Post Image" onerror="this.src='https://via.placeholder.com/400x200/1B2B40/F7A51C?text=DesignU+Blog'">
                </div>
                <div class="blog-text">
                    <h2>Getting Started with Digital Marketing</h2>
                    <p class="blog-meta">By DesignU Team | March 15, 2024</p>
                    <p>Learn the fundamentals of digital marketing and how to create effective campaigns that drive results. From understanding your audience to measuring success...</p>
                    <a href="https://designu.io/blog/" class="read-more" target="_blank">Read More</a>
                </div>
            </article>
            <article class="blog-post">
                <div class="blog-image">
                    <img src="img/300-x-100-icon-1.png" alt="Blog Post Image" onerror="this.src='https://via.placeholder.com/400x200/1B2B40/F7A51C?text=DesignU+Blog'">
                </div>
                <div class="blog-text">
                    <h2>Content Creation Tips for Beginners</h2>
                    <p class="blog-meta">By DesignU Team | March 10, 2024</p>
                    <p>Discover essential tips and strategies for creating engaging content that resonates with your audience and drives engagement...</p>
                    <a href="https://designu.io/blog/" class="read-more" target="_blank">Read More</a>
                </div>
            </article>
            <article class="blog-post">
                <div class="blog-image">
                    <img src="img/300-x-100-icon-1.png" alt="Blog Post Image" onerror="this.src='https://via.placeholder.com/400x200/1B2B40/F7A51C?text=DesignU+Blog'">
                </div>
                <div class="blog-text">
                    <h2>Social Media Management Best Practices</h2>
                    <p class="blog-meta">By DesignU Team | March 5, 2024</p>
                    <p>Master the art of social media management with these proven strategies and tools that will help you grow your online presence...</p>
                    <a href="https://designu.io/blog/" class="read-more" target="_blank">Read More</a>
                </div>
            </article>
            <article class="blog-post">
                <div class="blog-image">
                    <img src="img/300-x-100-icon-1.png" alt="Blog Post Image" onerror="this.src='https://via.placeholder.com/400x200/1B2B40/F7A51C?text=DesignU+Blog'">
                </div>
                <div class="blog-text">
                    <h2>UI/UX Design Principles for Web Developers</h2>
                    <p class="blog-meta">By DesignU Team | March 1, 2024</p>
                    <p>Essential UI/UX design principles that every web developer should know to create better user experiences...</p>
                    <a href="https://designu.io/blog/" class="read-more" target="_blank">Read More</a>
                </div>
            </article>
            <article class="blog-post">
                <div class="blog-image">
                    <img src="img/300-x-100-icon-1.png" alt="Blog Post Image" onerror="this.src='https://via.placeholder.com/400x200/1B2B40/F7A51C?text=DesignU+Blog'">
                </div>
                <div class="blog-text">
                    <h2>Career Opportunities in Tech: What's Next?</h2>
                    <p class="blog-meta">By DesignU Team | February 25, 2024</p>
                    <p>Explore the latest career opportunities in technology and how to position yourself for success in the digital age...</p>
                    <a href="https://designu.io/blog/" class="read-more" target="_blank">Read More</a>
                </div>
            </article>
            <article class="blog-post">
                <div class="blog-image">
                    <img src="img/300-x-100-icon-1.png" alt="Blog Post Image" onerror="this.src='https://via.placeholder.com/400x200/1B2B40/F7A51C?text=DesignU+Blog'">
                </div>
                <div class="blog-text">
                    <h2>Building a Portfolio That Stands Out</h2>
                    <p class="blog-meta">By DesignU Team | February 20, 2024</p>
                    <p>Learn how to create a compelling portfolio that showcases your skills and attracts potential employers or clients...</p>
                    <a href="https://designu.io/blog/" class="read-more" target="_blank">Read More</a>
                </div>
            </article>
        `;
    }
}

// Fallback static content for opportunities
function loadStaticOpportunitiesContent() {
    const opportunitiesGrid = document.querySelector('.opportunities-grid');
    if (opportunitiesGrid) {
        opportunitiesGrid.innerHTML = `
            <div class="opportunity-card">
                <div class="opportunity-icon">
                    <i class="fas fa-laptop-code"></i>
                </div>
                <h3>Digital Marketing Specialist</h3>
                <p class="company">Tech Company Ltd.</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> Lagos, Nigeria</p>
                <p class="salary">₦150,000 - ₦250,000</p>
                <p class="description">We're looking for a creative digital marketing specialist to join our team...</p>
                <a href="#" class="btn-primary">Apply Now</a>
            </div>
            <div class="opportunity-card">
                <div class="opportunity-icon">
                    <i class="fas fa-palette"></i>
                </div>
                <h3>UI/UX Designer</h3>
                <p class="company">Design Studio</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> Remote</p>
                <p class="salary">₦200,000 - ₦350,000</p>
                <p class="description">Join our design team and help create amazing user experiences...</p>
                <a href="#" class="btn-primary">Apply Now</a>
            </div>
            <div class="opportunity-card">
                <div class="opportunity-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <h3>Content Creator</h3>
                <p class="company">Media Agency</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> Abuja, Nigeria</p>
                <p class="salary">₦120,000 - ₦200,000</p>
                <p class="description">Create engaging content for various digital platforms...</p>
                <a href="#" class="btn-primary">Apply Now</a>
            </div>
            <div class="opportunity-card">
                <div class="opportunity-icon">
                    <i class="fas fa-share-alt"></i>
                </div>
                <h3>Social Media Manager</h3>
                <p class="company">Startup Inc.</p>
                <p class="location"><i class="fas fa-map-marker-alt"></i> Lagos, Nigeria</p>
                <p class="salary">₦180,000 - ₦300,000</p>
                <p class="description">Manage social media presence and grow our online community...</p>
                <a href="#" class="btn-primary">Apply Now</a>
            </div>
        `;
    }
}

// Debug function to test API endpoints
async function debugAPI() {
    console.log('Testing DesignU API endpoints...');
    
    try {
        // Test 1: Check if API is accessible
        console.log('1. Testing: API accessibility');
        const testResponse = await fetch('https://designu.io/wp-json/');
        if (testResponse.ok) {
            console.log('✅ API is accessible');
        } else {
            console.log('❌ API not accessible:', testResponse.status);
        }
        
        // Test 2: Get all posts
        console.log('2. Testing: Get all posts');
        const allPostsResponse = await fetch('https://designu.io/wp-json/wp/v2/posts?per_page=5');
        if (allPostsResponse.ok) {
            const allPosts = await allPostsResponse.json();
            console.log('✅ All posts:', allPosts.map(p => ({ id: p.id, title: p.title.rendered })));
        } else {
            console.log('❌ Failed to get posts:', allPostsResponse.status);
        }
        
        // Test 3: Get categories
        console.log('3. Testing: Get categories');
        const categoriesResponse = await fetch('https://designu.io/wp-json/wp/v2/categories');
        if (categoriesResponse.ok) {
            const categories = await categoriesResponse.json();
            console.log('✅ Categories:', categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })));
            
            // Look for Articles category
            const articlesCategory = categories.find(cat => 
                cat.name === 'Articles' || cat.slug === 'articles'
            );
            if (articlesCategory) {
                console.log('✅ Found Articles category:', articlesCategory);
            } else {
                console.log('❌ Articles category not found');
            }
        } else {
            console.log('❌ Failed to get categories:', categoriesResponse.status);
        }
        
        // Test 4: Get posts with embedded data
        console.log('4. Testing: Get posts with embedded data');
        const embeddedResponse = await fetch('https://designu.io/wp-json/wp/v2/posts?per_page=3&_embed');
        if (embeddedResponse.ok) {
            const embeddedPosts = await embeddedResponse.json();
            console.log('✅ Embedded posts:', embeddedPosts.map(p => ({
                id: p.id,
                title: p.title.rendered,
                categories: p._embedded?.['wp:term']?.[0]?.map(c => c.name) || []
            })));
        } else {
            console.log('❌ Failed to get embedded posts:', embeddedResponse.status);
        }
        
        // Test 5: Try specific post IDs
        console.log('5. Testing: Specific post IDs');
        for (let i = 1; i <= 5; i++) {
            try {
                const postResponse = await fetch(`https://designu.io/wp-json/wp/v2/posts/${i}`);
                if (postResponse.ok) {
                    const post = await postResponse.json();
                    console.log(`✅ Post ${i}:`, post.title.rendered);
                } else {
                    console.log(`❌ Post ${i}: Not found (${postResponse.status})`);
                }
            } catch (error) {
                console.log(`❌ Post ${i}: Error -`, error.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Debug API error:', error);
    }
}

// Call debug function when page loads (remove this in production)
// debugAPI();

// Initialize content based on current page
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('blog.html')) {
        console.log('Loading blog page...');
        fetchBlogPosts();
        // Run debug function to diagnose API issues
        debugAPI();
    } else if (currentPage.includes('opportunities.html')) {
        console.log('Loading opportunities page...');
        fetchOpportunities();
    }
    
    // Uncomment the line below to debug API issues
    // debugAPI();
});

// Slideshow functionality for hero section
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlide = (n + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

// Auto-advance slides
if (slides.length > 0) {
    setInterval(nextSlide, 5000);
}

// Dot navigation
dots.forEach((dot, index) => {
    const eventType = 'ontouchstart' in window ? 'touchstart' : 'click';
    dot.addEventListener(eventType, (e) => {
        e.preventDefault();
        showSlide(index);
    });
});

// Initialize first slide
if (slides.length > 0) {
    showSlide(0);
}

// Newsletter form handling
const handleNewsletterSubmit = () => {
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = form.querySelector('input[placeholder="First name"]').value;
            const lastName = form.querySelector('input[placeholder="Last name"]').value;
            const email = form.querySelector('input[type="email"]').value;
            
            // Here you would typically send this data to your backend
            console.log('Newsletter signup:', { firstName, lastName, email });
            
            // Show success message
            alert('Thank you for subscribing to our newsletter!');
            form.reset();
        });
    }
};

// Partner logo hover effect
const setupPartnerLogos = () => {
    const logos = document.querySelectorAll('.partners-grid img');
    logos.forEach(logo => {
        logo.addEventListener('mouseenter', () => {
            logos.forEach(l => {
                if (l !== logo) {
                    l.style.opacity = '0.3';
                }
            });
        });
        
        logo.addEventListener('mouseleave', () => {
            logos.forEach(l => {
                l.style.opacity = '0.7';
            });
        });
    });
};

// Video player functionality
const setupVideoPlayers = () => {
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', function() {
            // Get the iframe
            const iframe = this.querySelector('iframe');
            // Update the src to start playing
            const videoSrc = iframe.src;
            iframe.src = videoSrc.replace('autoplay=0', 'autoplay=1');
            // Add playing class to hide overlay
            this.classList.add('playing');
        });
    });
};

// Stats counter animation
const animateCounter = (element, target) => {
    let current = 0;
    const duration = 3500; // 3.5 seconds
    const framesPerSecond = 30;
    const totalFrames = (duration / 1000) * framesPerSecond;
    const increment = target / totalFrames;
    
    const easeOutQuart = x => 1 - Math.pow(1 - x, 4);
    
    let frame = 0;
    const updateCounter = () => {
        frame++;
        const progress = frame / totalFrames;
        const easedProgress = easeOutQuart(progress);
        
        current = Math.min(target, Math.floor(target * easedProgress));
        
        // Format number with commas if it's over 999
        element.textContent = current.toLocaleString();
        
        if (frame < totalFrames) {
            setTimeout(() => requestAnimationFrame(updateCounter), 1000 / framesPerSecond);
        }
    };
    
    updateCounter();
};

// Initialize counter animations when they come into view
const initCounters = () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                animateCounter(counter, target);
                observer.unobserve(counter); // Only animate once
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(counter => {
        observer.observe(counter);
    });
};

// Mobile menu functionality
const createMobileMenu = () => {
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuButton && navLinks) {
        // Use touchstart for better iOS compatibility
        const eventType = 'ontouchstart' in window ? 'touchstart' : 'click';
        
        mobileMenuButton.addEventListener(eventType, function(e) {
            e.preventDefault();
            e.stopPropagation();
            navLinks.classList.toggle('show');
            this.classList.toggle('active');
            
            // Prevent body scroll when menu is open
            if (navLinks.classList.contains('show')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }

    // Dropdown toggle for mobile
    const dropdown = document.querySelector('.nav-links .dropdown');
    const dropdownToggle = dropdown ? dropdown.querySelector('a') : null;
    if (dropdown && dropdownToggle) {
        dropdownToggle.addEventListener('click', function(e) {
            // Only activate on mobile
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.toggle('active');
            }
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-container')) {
            navLinks.classList.remove('show');
            if (mobileMenuButton) {
                mobileMenuButton.classList.remove('active');
            }
            // Also close dropdown
            if (dropdown) dropdown.classList.remove('active');
            // Restore body scroll
            document.body.style.overflow = '';
        }
    });
    
    // Close mobile menu on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            navLinks.classList.remove('show');
            if (mobileMenuButton) {
                mobileMenuButton.classList.remove('active');
            }
            if (dropdown) dropdown.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Handle orientation change
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            navLinks.classList.remove('show');
            if (mobileMenuButton) {
                mobileMenuButton.classList.remove('active');
            }
            if (dropdown) dropdown.classList.remove('active');
            document.body.style.overflow = '';
        }, 100);
    });
};

// Initialize all functionality
const init = () => {
    createMobileMenu();
    handleNewsletterSubmit();
    setupPartnerLogos();
    setupVideoPlayers();
    initCounters(); // Add counter initialization
    
    // iOS specific optimizations
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Fix for iOS Safari viewport issues
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // Fix for iOS Safari 100vh issue
        const setVH = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setVH();
        window.addEventListener('resize', setVH);
        window.addEventListener('orientationchange', setVH);
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    }
};

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', init);