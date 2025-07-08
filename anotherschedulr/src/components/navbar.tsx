import styles from '@/styles/navbar.module.css'

const Navbar = () => {
    return (
      <header className={styles.cssHeader}>
        <div className={styles.cssNavbarDiv}>
            <div>
                <a>anotherschedulr</a>
            </div>
            <nav>
                <a>Product</a>
                <a>Mission</a>
                <a>Pricing</a>
            </nav>
            <a>Sign Up</a>
        </div>
      </header>
    );
  };

  export default Navbar;