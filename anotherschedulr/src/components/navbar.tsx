import styles from '@/styles/navbar.module.css'

const Navbar = () => {
    return (
      <header className={styles.cssHeader}>
        {/* adding tailwinf with my css class here */}
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${styles.cssNavbarDiv}`}>
            <div>
                <a className={styles.cssNavText}>anotherschedulr</a>
            </div>
            <nav>
                <a className={styles.cssNavText}>Product</a>
                <a className={styles.cssNavText}>Mission</a>
                <a className={styles.cssNavText}>Pricing</a>
            </nav>
            <a className={styles.cssNavText}>Sign Up</a>
        </div>
      </header>
    );
  };

  export default Navbar;