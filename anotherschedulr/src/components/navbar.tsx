import styles from '@/styles/navbar.module.css'

const Navbar = () => {
    return (
      <header className={styles.cssHeader}>
        <div className={styles.cssNavbarDiv}>
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