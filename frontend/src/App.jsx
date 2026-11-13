import axios from "axios";
import "./App.css";
import { useState, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";

function App(){
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin]= useState(false);
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [error, setError] = useState("");
  const [ success, setSuccess] = useState("");
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [cartMessages, setCartMessages] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [products, setProducts] = useState([]);
  const [productError, setProductError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  

  const [series, setSeries] = useState(null);
  const [Chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [contentError, setContentError] = useState("");
  const [allSeries, setAllSeries] = useState([]);

  const [showAdmin, setShowAdmin] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(()=>Boolean(localStorage.getItem("token")));
 

  useEffect(() =>{
    const fetchProducts= async()=> {
      try{
        const response = await axios.get(
          "http://localhost:5000/api/products"
        );

        setProducts(response.data);

        if(response.data.length > 0){
          setSelectedProduct(response.data[0]);
        }else{
          setSelectedProduct(null);
        }
      } catch(error){
        console.error("Error fetching products:",error);
      }
    };
    fetchProducts();
  },[]);


  // FETCH SERIES AND CHAPTERS
  useEffect(() => {
    async function loadSeriesContent() {
      try{
        const seriesResponse = await fetch(
          "http://localhost:5000/api/content/series");
          if(!seriesResponse.ok){throw new Error("Unable to load series");
          }
          
          const seriesData = await seriesResponse.json();

          const publishedSeries = seriesData.filter(item => item.status === "Published")
           .sort((a, b)=> a.id - b.id);
          
          setAllSeries(publishedSeries);

          const defaultSeries = publishedSeries.find(item => item.id === 1)||publishedSeries[0];
          if(!defaultSeries){
            setContentError("No published series found");
            return;
          }
          setSeries(defaultSeries);
     
          const chaptersResponse = await fetch(
            `http://localhost:5000/api/content/series/${defaultSeries.id}/chapters`);
          

          if(!chaptersResponse.ok){ throw new Error("Unable to load chapters");}
          const chaptersData = await chaptersResponse.json();
          setChapters(chaptersData);
          if(chaptersData.length > 0){
            setSelectedChapter(chaptersData[0]);       
          }
      }catch(err){
        setContentError(err.message);
      }
      
    }
    loadSeriesContent();
  }, []);


  async function handleSeriesChange(selectedSeries) {
    try{
      setSeries(selectedSeries);
      setSelectedChapter(null);
      setChapters([]);

      const response = await fetch(
         `http://localhost:5000/api/content/series/${selectedSeries.id}/chapters`);
         if(!response.ok){
          throw new Error("Unable to load chapters");
         }

         const chaptersData = await response.json();
         setChapters(chaptersData);
         if(chaptersData.length > 0){
          setSelectedChapter(chaptersData[0]);
         }

         setTimeout(()=>{
          document.getElementById("series-01")?.scrollIntoView({
            behavior:"smooth",
            block: "start"
          });

         },100);
      
    }catch(err){
      setContentError(err.message);

    }
    
  }
   

    function getPasswordStrength(value){
      if (!value) return{level: 0, label: ""};
      let score = 0;

      if(value.length >= 8) score++;
      if(value.length >= 12) score++;
      if(/[a-z]/.test(value) && /[A-Z]/.test(value)) score++;
      if(/[0-9]/.test(value)) score++;
      if(/[^A-Za-z0-9]/.test(value)) score++;

      if(score <= 2){
        return { level: 1, label: "Weak" };
      }

      if(score <= 3){
        return { level: 2, label: "Medium" };
      }

      return { level: 3, label: "Strong" };  

    }

    const strength = getPasswordStrength(password);
    const product =products[0];


    async function handleSignup(e) {
      e.preventDefault();

      setError("");
      setSuccess("");

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!emailPattern.test(email)){
        setError("Please enter a valid email address.");
        return;
      }

      if (password.length < 8){
        setError("Password must contain at least 8 characters.");
        return;
      }

      if (password !== confirmPassword){
        setError("Passwords do not match.");
        return;
      }

      try{
        const response = await fetch(
          "http://localhost:5000/api/auth/signup",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"},
            body: JSON.stringify({name, email, password})
            });
            const data = await response.json();
            if(!response.ok){
              throw new Error(data.error || "Signup failed");
            }          

            setSuccess("Account created successfully! Please log in.");
            setShowLogin(true);
            setPassword("");
            setConfirmPassword("")
               
      }catch(err){
        setError(err.message);
      }    

    }

    async function handleLogin(e) {
      e.preventDefault();

      setError("");
      setSuccess("");

      try{
        const response = await axios.post(
          "http://localhost:5000/api/auth/login",
          {
            email: email,
            password: password
          }
        );
        
        // Save authentication details
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user",JSON.stringify(response.data.user));
        setIsLoggedIn(true);
        
        setSuccess(response.data.message);
        setError("");
      } catch(error){
        setError(error.response?.data?.message||"Login failed. Please try again.");
        }
      
    }

    const handleLogout =()=>{
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setIsLoggedIn(false);
    };

    function closeSignup(){
      setShowSignup(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setError("");
      setSuccess("");
    }

    function handleAddToCart(product){
      const currentSize = selectedSizes[product.id];

      if(!currentSize){
        setCartMessages((prev) =>({
          ...prev,
          [product.id]: "Please select a size before adding to cart.",
        }));
        return;
      }

      setCartItems((previousItems) => {
        const existingItem= previousItems.find(
          (item) => 
          item.productId === product.id && item.size === currentSize);
          
          if(existingItem){
            return previousItems.map((item) => item.productId ===product.id && item.size === currentSize ? {
              ...item, quantity: item.quantity + 1 }:item );
          }

          return[...previousItems,{
            productId: product.id,
            name:product.name,
            price: Number(product.price),
            image: product.image_url,
            size: currentSize,
            quantity: 1
          },];
      });

      setCartMessages((prev)=>({ ...prev, [product.id]: `${product.name} has been added to your cart. Size: ${currentSize}`}));
    }

    function updateCartQuantity(productId, size, change){
      setCartItems((previousItems) => previousItems.map((item) => {
        if(item.productId === productId && item.size === size ) {
          return{
          ...item, quantity: item.quantity + change};
        }
          return item;
      })
      .filter((item) => item.quantity > 0)
      );
    }

    function removeCartItem(productId, size) {
      setCartItems((previousItems) => previousItems.filter((item)=>
        !(item.productId === productId && item.size === size))
    );
    }

        if(showAdmin){
          return(
            <div>
              <button onClick={()=>
                setShowAdmin(false)}
                style={{
                  margin: "15px",
                  padding: "10px 18px",
                  cursor: "pointer"
                }}
                >Back to Website</button>
                <AdminDashboard />
            </div>
          );
        }

        return (
          <div className = "app">
            <nav className = "navbar">
              <h2 className="brand-logo" onClick={() => {
                setShowSignup(false);
                setShowLogin(false);
                setShowCart(false);
                setError("");
                setSuccess("");
                setShowPassword(false);
                setShowForgotPassword(false);
                window.location.hash = "";
              }}>Quiet Battles</h2>

              <div className="nav-links">
                <a href="#home">Home</a>
                <a href="#philosophy">Our Philosophy</a>
                <a href="#archive">The Archive</a>
                <a href="#cart" className="cart-links" onClick={(e) => {
                  e.preventDefault();
                  setShowSignup(false);
                  setShowCart(true);
                  setError("");
                  setSuccess("");
                  window.location.hash = "cart";
                }}>🛒Cart(
                  {
                    cartItems.reduce(
                      (total, item) => total + item.quantity, 0
                    )
                  }
                )
                </a>

              </div>

              <div className = "nav-buttons">

                
                <button className="login-btn" onClick={() => { 
                  setShowSignup(true);
                  setShowLogin(true);                  
                  setError("");
                  setSuccess("");
                  }}>
                  Log In
                </button>

                <button className="login-btn" onClick={() => { 
                  setShowSignup(true);
                  setShowLogin(false);                  
                  setError("");
                  setSuccess("");
                  }}>
                  Sign Up

                </button>
                

                <button className="login-btn"
                        onClick={()=> setShowAdmin(true)}>
                          Admin

                </button>
              </div>
            </nav>

            {showSignup ? (
              <main className="signup">

                {showForgotPassword ? (
                  <>
                    <h2>Forgot Password?</h2>

                    <p className="auth-subtitle">
                      Don't worry! Enter your registered email address to reset your password.
                    </p>

                    <form key="forgot-password" onSubmit={(e) => {
                      e.preventDefault();
                      setError("")
                      setSuccess("");

                      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                      if(!emailPattern.test(email)){
                        setError("Please enter a valid email address.");
                        return;
                      }

                      setSuccess( "Your email is validated. Password reset functionality will be connected later.");

                    }
                    }>
                    
                    <input type="email" placeholder="Enter your registered email"
                      value={email} 
                      onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                      setSuccess("");
                      }}  required/>

                    {error && (
                      <p className="form-error">{error}</p>
                    )}


                    {success && (
                      <p className="form-success">{success}</p>
                    )}

                    <button type="submit">
                      Send Reset Link
                    </button>

                  </form>

                  <div className="auth-switch">
                    <button type="button" onClick={() => {
                      setShowForgotPassword(false);
                      setShowLogin(true);
                      setError("");
                      setSuccess("");
                      setEmail("");
                    }}>
                      Back to Login
                    </button>

                  </div>

                  </>
                ) :

                showLogin ? (
                  <>
                    <h2>Welcome Back</h2>
                    <p className="auth-subtitle">
                      Login to your account
                    </p>

                    <form key="login" onSubmit = {async(e)=>{
                      e.preventDefault();
                      setError("");
                      setSuccess("");
                      
                      try{
                        const response = await fetch("http://localhost:5000/api/auth/login",{
                          method:"POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({email, password})
                        });

                        const data = await response.json();

                        if(!response.ok){
                          throw new Error(data.error || "Login failed");
                        }
                        localStorage.setItem("token", data.token);
                        localStorage.setItem("user", JSON.stringify(data.user));

                        setSuccess("Login successful!");                        
                      }catch(err){
                        setError(err.message);
                      }
                    }}>

                      <input type="email" placeholder = "Your email" value={email}
                      onChange={(e)=>
                        setEmail(e.target.value)                        
                      } required/>
                      <input type = {showPassword ? "text" : "password"} placeholder = "Enter password" value={password}
                       onChange={(e)=>
                        setPassword(e.target.value)                       
                       }required/>

                      <button type = "button" className = "password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? "Hide Password" : "Show Password"}
                      </button>

                      <p className="forgot-password">
                        <button type="button" onClick={() => {
                          setShowLogin(false);
                          setShowForgotPassword(true);
                          setError("");
                          setSuccess("");
                        }}>
                          Forgot Password?
                        </button>
                        
                      </p>

                      {error && <p className="form-error">{error}</p>}
                      {success && <p className="form-success">{success}</p>}

                      <button type="submit">Log In</button>
                    </form>



                    <div className="auth-switch">Don't have an account?{" "}
                      <button type="button" onClick={() => {
                        setShowLogin(false);
                        setError("");
                        setSuccess("");
                        setShowPassword(false);
                      }}>
                        Sign Up

                      </button>

                    </div>
                  </>
                  
                
                ) : (
                  <>

                  <h2>Create Your Account </h2>

                  <form key="signup" onSubmit = {handleSignup}>
                    <input type ="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <input type ="email" placeholder="Your email" value={email} onChange={(e) =>{
                      setEmail(e.target.value);
                      setError("");
                      setSuccess("");
                    }}required/>
                    <input type = {showPassword ? "text": "password"} placeholder ="Create password" value = {password} onChange = {(e) => {setPassword(e.target.value);
                      setError("");
                      setSuccess("");
                    }} required />

                  
                  {/* password strength indicator */}
                  {password && (
                    <div className="password-strength">
                      <div className="strength-info">
                        <span>Password Strength </span>
                        <span className={`strength-label strength-${strength.level}`}>{strength.label}</span>
                      </div>

                      <div className="strength-bars">
                        {[1, 2, 3].map((bar) => (
                          <div key = {bar} className = {`strength-bar ${
                            bar <= strength.level ? `active strength-${strength.level}` : ""

                          }`
                        
                          }>

                          </div>
                        
                        ))}

                      </div>

                      <p className="strength-hint"> Use uppercase, lowercase, numbers and special characters.</p>
                    </div>

                  )}
                    <input type={showPassword ? "text" : "password"} placeholder="Confirm Password" value={confirmPassword}onChange={(e) => { setConfirmPassword(e.target.value);
                      setError("");
                      setSuccess("");
                    }
                    } required />

                    <button type ="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? "Hide Password": "Show Password"}        
                    </button>

                    {error && (
                      <p className ="form-error">{error}</p>
                    )
                    }


                    {success && (
                      <p className="form-success">{success}</p>
                    )
                    }

                    <button type="submit">Create Account</button>

                  </form>

                  <div className="auth-switch">
                    {
                      showLogin ? (
                        <p>
                          Don't have an account?{""}
                          <button type="button" onClick={() => {
                            setShowLogin(false);
                            setError("");
                            setSuccess("");
                          }}>
                            Sign Up                

                          </button>
                        </p>
                      ) : (
                        <p>
                          Already have an account?{" "}
                          <button type = "button" onClick = {() => {
                            setShowLogin(true);
                            setError("");
                            setSuccess("");
                          }}>

                            Log in

                          </button>
                        </p>

                      )
                    }
                                        
                  </div>

                    </>

                  )
                  }           
                              
              </main>

              ) : showCart ? (
                <main className="cart-page" id="cart">
                  <div className="cart-heading">
                    <p className="cart-label">
                      QUIET BATTLES™
                    </p>
                    <h1>Your Shopping Bag</h1>
                    <p>Review your selected pieces before checkout.</p>
                  </div>
                  
                  {cartItems.length === 0 ? (
                    <div className="empty-cart">
                      <h2>Your bag is waiting.</h2>
                      <p>Discover something that represents your story.</p>
                      <button className="continue-shoping" onClick={() => {setShowCart(false);
                        window.location.hash = "product-01";
                      }
                      }>
                        CONTINUE SHOPPING
                      </button>
                    </div>

                  ):(
                    <div className="cart-layout">
                      <section className="cart-products">
                        <div className="cart-section-heading">
                          <h2>Your items</h2>
                          <span>{cartItems.reduce((total, item) =>
                            total + item.quantity, 0
                            )} items
                          </span>
                        </div>

                        {cartItems .map((item) => (
                          <div className="cart-product" key={`${item.productId}-${item.size}`}>
                            <img src={item.image} alt={item.name} className="cart-product-image" />
                            <div className="cart-product-info">
                              <p className="cart-product-category">THE GENTLE ARMOR™</p>
                              <h3>{item.name}</h3>
                              <p>Size: {item.size}</p>
                              <p className="cart-product-price">₹{Number(item.price).toLocaleString("en-IN")}</p>


                              <div className="cart-controls">
                                <button onClick={() => updateCartQuantity(item.productId, item.size, -1)}aria-label="Decrease quantity">
                                  -
                                </button>
                                <span>{item.quantity}</span>

                                <button onClick={() => updateCartQuantity(item.productId, item.size, 1)}aria-label="Increase quantity">
                                  +
                                </button>

                                <button className="remove-item" onClick={() => removeCartItem(item.productId,item.size)}>
                                  Remove
                                </button>

                              </div>
                            </div>

                            <p className="cart-item-subtotal">₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}</p>       

                          </div>
                        ))}

                        <button className="continue-shopping" onClick={() => {
                          setShowCart(false);
                          window.location.hash = "product-01";
                         }}>
                          CONTINUE SHOPPING
                        </button>

                      </section>
                      
                      <aside className="order-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-row">
                          <span>Subtotal </span>
                          <span>₹{cartItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0).toLocaleString("en-IN")}</span>

                        </div>

                        <div className="summary-row">
                          <span>Delivery</span>
                          <span className="free-delivery">FREE</span>

                        </div>

                        <div className="summary-divider"></div>

                        <div className="summary-total">
                          <span>Total</span>
                          <span>₹{cartItems.reduce((total, item) => total + Number(item.price) * item.quantity, 0).toLocaleString("en-IN")}</span>

                        </div>

                        <button className="checkout-btn" onClick={() =>
                          alert("Checkout will be connected after backend integration.")
                        }>
                          PROCEED TO CHECKOUT
                        </button>

                        <p className="secure-note">
                          Your journey. Your choice. Your story.

                        </p>

                      </aside>
                                            
                    </div>
                  )
                }
                </main>

            ) : (

              <> 
                {contentError &&(
                  <p className="form-error">{contentError}</p>
                  )
                }

                <main className = "hero" id="home">
                  <div className="hero-content">
                    <p className="hero-label">QUIET BATTLES™ - EST. WITH PURPOSE</p>
                    <h1>WEAR YOUR <span>BATTLES.</span></h1>
                    <p>Every battle shapes who you are. 
                       Every story deserves to be worn.
                    </p>

                    <a href="#archive" className="hero-button">EXPLORE THE ARCHIVE</a>

                  </div>
                  
                </main>

              


                <section className ="brand-intro" id="philosophy">
                  <div className ="brand-intro-content">

                    <p className ="section-label">
                      THE PHILOSOPHY 
                    </p>

                    <h2>
                      WEAR YOUR <span>BATTLES.</span>
                    </h2>

                    <p className="brand-description">
                      Every battle tells a story. Every experience shapes who we become.
                      Quiet Battles is a remainder that strength does not always need to be seen.
                    </p>

                    <p className="brand-message">
                      YOUR STORY. YOUR STRENGHT. YOUR ARMOR.
                    </p>

                  </div>
                </section>

                <section className="featured-collection" id="archive">
                  <div className="collection-heading">
                    <p>THE ARCHIVE</p>
                    <h2>STORIES WORTH WEARING.</h2>
                    <p>Explore the collections. Discover the stories behind every chapter.</p>

                  </div>

                  {allSeries.map((item, index)=>(
                  <div className="collection-card" key={item.id} id={`archive-series-${item.id}`} >
                    <p>SERIES {String(index + 1).padStart(2, "0")}</p>
                    <h3>{item.title.replace(/^SERIES\s*\d+\s*[-–—]?\s*/i, "")}</h3>
                    <p>
                      {item.description}
                    </p>

                    <button onClick={()=> handleSeriesChange(item)}>DISCOVER THE SERIES</button>
                    {/*<a href="#series-01">DISCOVER THE SERIES</a> */}
                    
                  </div>
                  ))}

                </section>

                { /* SERIES 01 DETAIL PAGE */}

                <section className="series-page" id="series-01">
                  <div className="series-intro">
                    <p className="series-label">
                      QUIET BATTLES™ - SERIES 01"
                    </p>

                    <h2>{series?.title ?.replace(/^SERIES\s*0*1\s*[-–—:]?\s*/i, "").trim() || "THE GENTLE ARMOR™"}</h2>

                    <p>
                      {series?.description || "A collection inspired by quiet strength, resilience and the battles we carry within."}
                    </p>

                    

                    <p className="series-tagline">
                      EVERY STORY DESERVES TO BE WORN.
                    </p>

                  </div>

                  <div className="chapters-section">
                    <p className="series-label">EXPLORE THE COLLECTION</p>
                    <h2>THE FIVE CHAPTERS</h2>

                    <p className="chapters-description">
                      Every chapter represents a different journey.
                      Discover the stories behind the collection.
                    </p>

                    <div className="chapter-grid">
                      {Chapters.map((chapter)=>(
                        <article className="chapter-card" key={chapter.id}>
                          <span>
                            CHAPTER{String(chapter.chapter_number).padStart(2, "0")}
                          </span>
                          <h3>{chapter.title}</h3>
                          <p>{chapter.story_content}</p>

                          <button type="button" 
                          onClick={()=>{
                            setSelectedChapter(chapter);
                            document.getElementById("chapter-01")?.scrollIntoView({
                              behavior: "smooth"
                            });
                          }}>
                            EXPLORE CHAPTER
                          </button>
                        </article>
                      ))}

                    </div>
                  </div>

                </section>

                {/* CHAPTER 01 - THE QUIET BEGINNING */}

                <section className="chapter-page" id="chapter-01">
                  <div className="chapter-hero">
                    <p className="chapter-label">
                      QUIET BATTLES™ - SERIES 01 - CHAPTER {String(selectedChapter?.chapter_number||1).padStart(2,0)}                      
                    </p>

                    <h1>{selectedChapter?.title || "THE QUIET BEGINNING"}</h1>

                    <p>{selectedChapter?.story_content ||"Every journey begins with a story that the world cannot see."}           
                    </p>

                    <span>YOUR STORY BEGINS HERE.</span>                    
                  </div>

                  <div className="chapter-story">
                    <div className="story-content">
                      <p className="chapter-label">THE STORY</p>
                      <h2>{selectedChapter?.titlle || "Some battles happen in silence."}</h2>

                      <p>{ selectedChapter?.story_content ||"Not every struggle is visible. Some battles are fought behind quiet smiles, sleepless nights and moments when giving up feels easier than moving forward."}
                      </p>

                      
                    </div>

                    <div className="story-image">
                      <img src={selectedChapter?.cover_image ||"https://images.unsplash.com/photo-1529139574466-a303027c1d8b"} alt={selectedChapter?.title || "Fashion and personal expression" }/>                      
                    </div>

                  </div>

                  <div className="chapter-quote">
                    <p>"YOUR BATTLES MAY BE SILENT.</p>
                    <h2>YOUR STRENGTH IS NOT INVISIBLE."</h2>
                  </div>

                  <div className="chapter-closing">
                    <p className="chapter-label">THE GENTLE ARMOR™</p>
                    <h2>Wear your Beginning </h2>
                    <p>
                      Every story deserves to be worn. Discover the piece that represents
                      your journey.
                    </p>

                    <a href="#product-01" className="hero-button">DISCOVER THE PRODUCT</a>
                    <br />
                    <a href="#series-01" className="back-link">BACK TO SERIES </a>

                  </div>

                </section>


                {/* PRODUCT 01 - THE QUIET BEGINNING */}
                
                <section className="product-page" id="product-01">
                  <div className="product-intro">
                    <p className="chapter-label">
                      QUIET BATTLES™ - SERIES 01
                    </p>

                    <h2>OUR COLLECTION</h2>

                    <p>
                      Discover  pieces inspired by silent strength, courage and the stories we carry within.
                    </p>                                

                  </div>

                                  
                  {products.length > 0 ? (
                    <div className="product-list-container">
                      {products.map((item) => (
                        <div className="product-container" key={item.id}>

                          <div className="product-image">
                            <img
                              src={item.image_url}
                              alt={item.name}
                            />
                          </div>

                          <div className="product-details">

                            <p className="chapter-label">
                              CHAPTER 01 COLLECTION
                            </p>

                            <h2>THE GENTLE ARMOR™</h2>

                            <h3>{item.name}</h3>

                            <p>{item.description}</p>

                            <p className="product-price">
                              ₹{Number(item.price).toLocaleString("en-IN")}
                            </p>

                            <p className="demo-note">
                              Sample demonstration price
                            </p>

                            <p className="size-heading">
                              SELECT YOUR SIZE
                            </p>

                            <div className="size-options">
                              {["S", "M", "L", "XL"].map((size) => (
                                <button
                                  key={size}
                                  type="button"
                                  className={`size-option ${
                                    selectedSizes[item.id] === size ? "selected" : ""
                                  }`}
                                  onClick={() => {
                                    setSelectedSizes((prev)=>({
                                      ...prev,[item.id]:size,
                                    }));
                                    setCartMessages((prev)=>({
                                      ...prev,
                                      [item.id]: "",

                                    }));
                                  }}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              className="add-cart-btn"
                              onClick={() => handleAddToCart(item)}
                            >
                              ADD TO CART
                            </button>

                            {cartMessages[item.id] && (
                              <p className="cart-messages">
                                {cartMessages[item.id]}
                              </p>
                            )}

                            <p className="product-tagline">
                              YOUR STORY. YOUR STRENGTH.
                            </p>

                          </div>
                          
                        </div>
                      ))}
                      <a href="#chapter-01" className="back-link">
                                BACK TO CHAPTER 01
                          </a>
                    </div>
            ) : (
                    <p>No products available currently.</p>
            )}

          </section>

        </>

      )}
    </div>
  );
}

export default App;